# Welcome to cds-kafka


## About this project

This project is a plugin for the SAP Cloud Application Programming Model (CAP) providing native integration with Apache Kafka as the messaging service.



### Features
<p class="">cds-kafka&nbsp;offers the following capabilities:</p>
<ul>
<li><strong>CAP Integration:</strong><span>&nbsp;</span>Seamlessly integrates with CAP&rsquo;s native messaging framework for event handling.</li>
<li><strong>Event Publishing:</strong><span>&nbsp;Enables sending messages/events to Apache Kafka.</span></li>
<li><strong>Topic Subscription:</strong><span>&nbsp;Allows subscribing to one or multiple topics in Apache Kafka to receive incoming messages.</span></li>
<li><strong>Advanced Topic Matching:</strong><span>&nbsp;Supports subscription to multiple topics using regular expressions.</span></li>
<li><strong>CloudEvents Support:</strong><span>&nbsp;Provides built-in support for the CloudEvents specification.</span></li>
<li><strong>Kafka-Specific Features:</strong><span>&nbsp;Leverages Kafka-specific capabilities, including the use of keys, partitions and topic subscription behavior.</span></li>
<li><strong>Flexible Connectivity:</strong><span>&nbsp;Connects to Kafka instances hosted locally or in any cloud environment.</span></li>
<li><strong>Topic Management:</strong><span>&nbsp;Automates the creation of topics in Kafka.</span></li>
</ul>

More information in the introductiory blog posts in the SAP Community: 
* [Part 1 - Kafka and cds-kafka capabilities](https://community.sap.com/t5/technology-blogs-by-members/using-apache-kafka-for-messaging-in-the-sap-cloud-application-programming/ba-p/13970176)
* [Part 2 - cds-kafka in action and use cases](https://community.sap.com/t5/technology-blogs-by-members/using-apache-kafka-for-messaging-in-the-sap-cloud-application-programming/ba-p/13976974)


## Table of Contents

- [About this project](#about-this-project)
- [Requirements](#requirements)
- [Licensing](#licensing)
- [Setup](#setup)
- [Usage](#usage)


## Requirements

See [Getting Started](https://cap.cloud.sap/docs/get-started/in-a-nutshell) on how to jumpstart your development and grow as you go with SAP Cloud Application Programming Model.

## Licensing

`cds-kafka` is distributed under the MIT license. However, using `cds-kafka` within SAP Cloud Applications (`@sap/cds`) is subject to the [SAP Developer License](https://tools.eu1.hana.ondemand.com/developer-license-3_1.txt). Ensure that your use cases comply with all licensing terms and obligations.

## Setup

Install the plugin in an existing CAP project via:

```bash
npm add cds-kafka
```

Add the configuration of the message service:

```json
"cds": {
    "requires": {
        "messaging": {
            "kind": "kafka-service",
            "credentials": {
                "clientId": "my-cap-app",
                "brokers": [
                    "localhost:9028"
                ]
            },
            "consumer": {
                "groupId": "my-consumer-group"
            }
        },
        "kafka-service": {
            "impl": "cds-kafka"
        }
    }
}
```

Under the hood `cds-kafka` uses [KafkaJS](https://kafka.js.org) to connect to Kafka. Since Kafka itself uses a binary protocol over TCP, KafkaJS is the required abstraction layer to access Kafka functionality in JavaScript.
The `credentials` are directy passed into the KafkaJS constructor making it possible to connect to any local or cloud-based Kafka instance. More information on the configuration options are available in the [official KafkaJS documentation](https://kafka.js.org/docs/configuration).
Other configuration options for `cds-kafka`:

* **consumer.groupId**: The Kafka groupId used when subscribing to a topic.
* **topicname.fromBeginning**: Boolean if the subscription should receive messages from the beginning of the topic or only new ones. 

If you need an example on how to setup and use `cds-kafka` locally or on SAP BTP, please check [part 2 of the small blog series](https://community.sap.com/t5/technology-blogs-by-members/using-apache-kafka-for-messaging-in-the-sap-cloud-application-programming/ba-p/13976974).

## Usage

Please follow the [guide on messaging](https://cap.cloud.sap/docs/guides/messaging/) to get an overview over the messaging concepts of CAP. `cds-kafka` supports the native CAP APIs for sending and subscribing to events/messages.

Send a message to a Kafka topic `some-topic`:

```javascript
const messaging = await cds.connect.to('messaging') 
await messaging.emit('some-topic', { subject: 'Hello World' }
```

Subscribe to the topic `some-topic` and receive messages whenever a new message has been published:

```javascript
const messaging = await cds.connect.to('messaging') 
messaging.on('some-topic', (message) => console.log(message.data)) 
```

## Kafka-specifc functionality

### Topics and events types
By default, `cds-kafka` expects the name of the Kafka topic and the event type to be the same. As an example, sending an event `my/custom/event` to Kafka, would result in a topic with the same name to be created and used by CAP. However, there are possibilities to diverge from this rule and it is also possible to simply route all event types to a single topic or create a wild mix of topics and event types. To still have all the important information at hand, `cds-kafka` will add two headers to each message, containing the event and topic name:

* **x-sap-cap-event**: Contains the name of the event in CAP.
* **x-sap-cap-kafka-topic**: Indicates the actual Kafka topic from which the message originated.

This information can simply be accessed by inspecting the message headers.

```javascript

// Sending a message with different topic and event
await messaging.emit({
    event: 'my/custom/event',
    data: { subject: 'Hello World' },
    headers: {
      '@kafka.topic': 'some-generic-topic',
    }
});

// Subscring to the event
messaging.on("my/custom/event", (message) => {
  console.log(message.headers["x-sap-cap-event"]) // => my/custom/event
  console.log(message.headers["x-sap-cap-kafka-topic"]) // => some-generic-topic
})
```

### Subscribing to topics via Regular Expressions or catch-all (*)
`cds-kafka` is allowing subscriptions to multiple topics using regular expressions. Regular expressions enable subscribing to multiple topics with matching patterns. Since CAP’s internal API only supports string-based subscriptions, the two additional headers (see above) are used to track the information:

* **x-sap-cap-event**: Contains the registered regular expression.
* **x-sap-cap-kafka-topic**: Indicates the actual Kafka topic from which the message originated.

It's important to note, that regex-based subscriptions only work for already existing topics at the time of subscription. If a new matching topic is added after the application has started, the application must be restarted to receive messages from this topic.

Next to regular expressions, there is also support for a catch-all subscription which allows listening to all topics of a broker, excluding Kafka’s private ones (those starting with __). Internally, a regex subscription is created to match all public topics dynamically.

The following snippet shows how both options can be used:

```javascript
// Subscribe all topics matching the pattern (e.g. topic-A-1, topic-B-1...) 
messaging.on(/topic-(A|B|C)-.*/i, (message) => console.log(message))

// Subscribe all topics (excluding the Kafka private ones starting with __)
messaging.on("*", (message) => console.log(message))
```

### Using CloudEvents 
CAP has native support for the CloudEvents specification (see [documentation](https://cap.cloud.sap/docs/node.js/messaging#cloudevents-protocol)). By setting the message format to cloudevents supporting metadata will be added to all messages. `cds-kafka` also supports CloudEvents adhering to the [official CloudEvents specification for Apache Kafka](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/kafka-protocol-binding.md#33-structured-content-mode). While the specification distinguishes between wrapping the message data and adding headers, `cds-kafka` enables both at the same time. 
The reasons for this is, that CAP internally takes care of CloudEvents metadata and the incoming message is already stripped of all CloudEvents metadata. Because this metadata might be required, the header data will still be available when processing the incoming message.

The following example shows an inspection of a message in the event handler. The CloudEvents header fields (prefixed with ce-) are still visible and can be read programatically. 

 
```json
{
  data: { subject: 'Hello World' },
  headers: {
    'ce-specversion': '1.0',
    'ce-id': 'df396250-cb0d-4f88-97c4-0aa25faa12ef',
    'ce-type': 'some-topic',
    'ce-source': 'cap-kafka-example-app-1',
    'ce-time': '2025-01-02T15:59:24.265Z',
    'ce-datacontenttype': 'application/json',
  },
  event: 'some-topic'
}
```

### Specifying topic, key and partition when emitting a message
When emitting a message with `cap-kafka`, the default behavior is to send the message to a random partition, with the event name used as the topic. However, this behavior can be customized to suit more complex architectural needs. The following custom headers can be used to override the default behavior:

* **@kafka.key**:
Assign a key to the message for logical grouping or ordering purposes. For example, all messages related to a specific entity can use the same key, ensuring they are processed in the same order.
* **@kafka.partition**:
Specify a specific partition to which the message should be sent. This is useful for advanced use cases requiring precise control over partition distribution.
* **@kafka.topic:**
Override the default topic name (derived from the event name) and specify a custom topic. This enables routing messages to different topics based on dynamic conditions.

The following example show how those headers can be set. If set, those headers will not be sent to Kafka, but only used internally for applying the specific behavior. 

 ```javascript
await messaging.emit({
    event: 'ObjectCreated',
    data: { subject: 'Hello World' },
    headers: {
      '@kafka.key': '1234',
      '@kafka.partition': "0",
      '@kafka.topic': 'cap.test.object.created.v1',
    }
});
```

While the @kafka headers are only used internally, every message consumed by cds-kafka (even those not using the @kafk headers) will receive a set of additional headers providing information on Kafka internals. Next to the already described x-sap-cap-kafka-topic, the following header fields are available:

* **x-sap-cap-kafka-partition**: Contains the information of the partition the message has been retrieved from.
* **x-sap-cap-kafka-offset**: Contains the offset within the partition the message has been retrieved from.
* **x-sap-cap-kafka-timestamp**: Contains the timestamp the message has been stored inside Kafka.

These capabilities allow cap-kafka to support more sophisticated setups, such as architectures with specific partitioning strategies or dynamic topic routing, while not breaking CAP’s internal APIs.
 

## TODO

* Switch from KafkaJS to @confluentinc/kafka-javascript
* Look into confluent schema registry
* Add test suite
