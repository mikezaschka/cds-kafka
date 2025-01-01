const cds = require('@sap/cds')
const { Kafka, logLevel } = require('kafkajs')

class KafkaService extends cds.MessagingService {

    kafka;
    consumer;
    producer;

    async init() {
        super.init();
        this.LOG = cds.log('cds-kafka')

        // Override 
        const { on } = this
        this.on = function (...args) {
            if (Array.isArray(args[0])) {
                const [topics, ...rest] = args
                return topics.map(t => on.call(this, t, ...rest))
            } else {
                if (args[0] instanceof RegExp) {
                    const [topic, ...rest] = args
                    return on.call(this, topic.toString(), ...rest)
                }
            }
            return on.call(this, ...args)
        }

        cds.once('listening', async () => {
            this.LOG.info(`Using Kafka for ${this.name}`);
            await this.startListening()
        });

        cds.once("shutdown", async () => {
            this.LOG.info('Disconnecting from Kafka');
            await this.consumer.disconnect()
        });
    }

    /**
     * @override
     */
    on(event, cb) {
        if (event !== '*') this.subscribedTopics.set(this.prepareTopic(event, true), event)
        else this._listenToAll.value = true
        return super.on(event, cb)
    }

    getKafka() {
        this.kafka ||= new Kafka({
            clientId: this.getKafkaClientAndGroupId().clientId,
            brokers: cds.env.requires[this.name].brokers,
            logLevel: cds.env.requires[this.name].kafkaLogLevel || logLevel.ERROR,
            retry: {
                retries: 5, //Max number of retries per call
            }
        });
        return this.kafka;
    }

    /**
     * Handles sending messages
     * 
     * @param {*} msg 
     * @returns Promise<void>
     */
    async handle(msg) {
        if (msg.inbound) return super.handle(msg)
        let { event, data, headers } = msg;

        // Store the tenant in the message headers
        if (cds.context.tenant) {
            headers['x-sap-cap-tenant'] = cds.context.tenant
        }

        let message = {};

        if (this.options.format === 'cloudevents') {

            // Wrap the message in a CloudEvent according to: 
            // https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/kafka-protocol-binding.md#33-structured-content-mode
            // We also include the CloudEvent headers in the Kafka message headers
            // to allow for easier processing of the CloudEvent.

            const ce = {
                specversion: "1.0",
                id: cds.utils.uuid(),
                type: event,
                source: this.getKafkaClientAndGroupId().clientId,
                time: new Date().toISOString(),
                datacontenttype: 'application/json',
                data: data
            };
            message = {
                value: JSON.stringify(ce),
                headers: {
                    ...headers,
                    "content-type": "application/cloudevents+json",
                    "ce-specversion": ce.specversion,
                    "ce-id": ce.id,
                    "ce-type": ce.type,
                    "ce-source": ce.source,
                    "ce-time": ce.time,
                    "ce-datacontenttype": ce.datacontenttype
                }
            };
        } else {
            message = {
                value: (typeof data === 'string' && data) || JSON.stringify(data),
                headers
            }
        }

        // Send message to Kafka
        this.producer = this.getKafka().producer();
        await this.producer.connect();
        await this.ensureTopicExist(event)
        this.LOG.info('Emitting event:', event)
        await this.producer.send({
            topic: event,
            messages: [message]
        });
        await this.producer.disconnect()
    }

    /**
     * Starts listening to the subscribed topics
     *  
     * @returns Promise<void>
     */
    async startListening() {

        if (this.subscribedTopics.length === 0) {
            this.LOG.info('No topics to subscribe to')
            return
        }

        this.consumer = this.getKafka().consumer({ groupId: this.getKafkaClientAndGroupId().groupId });
        await this.consumer.connect();

        // Transform topics to regex if needed
        let topics = [...this.subscribedTopics.keys()].map(topic => this.stringOrRegex(topic));

        // Handle catch all topic
        if (this._listenToAll.value) {
            // Ignore private topics (starting with __)
            topics = [
                new RegExp('^(?!__).*')
            ];
        }

        // Merge potential topic configuration 
        const topicConfig = cds.env.requires[this.name].topics || {}
        for (const topic of topics) {

            if (topicConfig[topic]) {
                this.LOG.info(`Configuring topic ${topic} with:`, topicConfig[topic])
            }
            if (!(topic instanceof RegExp)) {
                await this.ensureTopicExist(topic);
            }
            await this.consumer.subscribe({ topics: [topic], ...topicConfig[topic] || {} })
            this.LOG.info('Subscribing to topic:', topic);
        }

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {

                // Message internally
                const eventContext = {
                    user: cds.User.Privileged,
                    _: {},
                    tenant: cds.context?.tentant
                }

                const msg = {
                    ...this.handleIncomingMessage(message.value.toString()),
                    headers: {
                        ...Object.entries(message.headers).reduce((acc, header) => {
                            acc[header[0]] = header[1].toString()
                            return acc
                        }, {}),
                        'x-sap-cap-kafka-partition': partition,
                        'x-sap-cap-kafka-offset': message.offset,
                        'x-sap-cap-kafka-timestamp:': message.timestamp,
                    },
                    event: topic
                }

                await this.tx(eventContext, tx => tx.emit(msg)).catch(err => {
                    this.LOG.error('Error while processing message:', err)
                    throw err
                })
            },
        })
    }

    /**
     * @override
     * @param {*} message 
     * @returns 
     */
    message4(message) {
        const msg = { ...message }

        msg.headers ||= {}
        if (!msg.inbound) {
            msg.headers = { ...msg.headers } // don't change the original object
            this.prepareHeaders(msg.headers, msg.event)
            msg.event = this.prepareTopic(msg.event, false)
        } else if (this.subscribedTopics) {

            const topics = [...this.subscribedTopics.keys()].map(topic => this.stringOrRegex(topic));
            const subscribedEvent = topics.find(topic => {
                return topic instanceof RegExp ? topic.test(msg.event) : topic === msg.event
            }
            );

            if (!subscribedEvent && !this._listenToAll.value) {
                const err = new Error(`No handler for incoming message with topic '${msg.event}' found.`)
                err.code = 'NO_HANDLER_FOUND' // consumers might want to react to that
                throw err
            }

            msg.event = subscribedEvent?.toString() || msg.event
            msg.headers['x-sap-cap-effective-topic'] = subscribedEvent || this._listenToAll.value ? '*' : msg.event
            msg.headers['x-sap-cap-original-topic'] = message.event
            msg.topic = message.event
        }

        return msg
    }

    handleIncomingMessage(message) {

        let payload;
        try {
            payload = JSON.parse(message)
        } catch {
            payload = message
        }

        let data, headers
        if (typeof payload === 'object' && 'data' in payload) {
            data = payload.data
            headers = { ...payload }
            delete headers.data
        } else {
            data = payload
            headers = {}
        }

        return {
            data,
            headers,
            inbound: true
        }
    }

    getKafkaClientAndGroupId() {
        let { groupId, clientId } = cds.env.requires[this.name];
        const vcapApplication = process.env.VCAP_APPLICATION && JSON.parse(process.env.VCAP_APPLICATION)
        return {
            groupId: groupId || cds.env.app?.id || vcapApplication?.application_id || `sap/cds/${process.pid}`,
            clientId: clientId || cds.env.app?.id || vcapApplication?.id || `sap/cds/${process.pid}`
        }
    }

    stringOrRegex(str) {
        const match = str.match(/^([\/~@;%#'])(.*)\1([gimsuy]*)$/);

        if (match) {
            // Delimiter-style regex
            try {
                return new RegExp(
                    match[2],
                    [...new Set(match[3])].join('') // Deduplicate flags
                );
            } catch (e) {
                // If the regex creation fails, fallback to returning the original string
                return str;
            }
        }

        // If no delimiters match, treat as a string
        return str;
    }

    async ensureTopicExist(topic) {
        if (!topic) return
        const admin = this.getKafka().admin()
        await admin.connect()

        const existingTopics = await admin.listTopics()
        if (!existingTopics.includes(topic)) {
            this.LOG._info && this.LOG.info(`Creating topic: ${topic}`)
            await admin.createTopics({ topics: [{ topic }] })
        }
        return admin.disconnect();
    }

}

module.exports = KafkaService