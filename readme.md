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
* Part 2 - cds-kafka in action and use cases (Coming soon)


## Table of Contents

- [About this project](#about-this-project)
- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)


## Requirements

See [Getting Started](https://cap.cloud.sap/docs/get-started/in-a-nutshell) on how to jumpstart your development and grow as you go with SAP Cloud Application Programming Model.


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
## Usage

Please follow the [guide on messaging](https://cap.cloud.sap/docs/guides/messaging/) to get an overview over the messaging concepts of CAP. cds-kafka supports the native (low-level) CAP api for sending and subscribing to events/messages.

Send a message to a Kafka topic `some-topic`:

```javascript
const messaging = await cds.connect.to('messaging') 
await messaging.emit('some-topic', { subject: 'Hello World' }
```

Subscribe to the topic `some-topic` and receive messages whenever a new message has been pubished:

```javascript
const messaging = await cds.connect.to('messaging') 
messaging.on('some-topic', (message) => console.log(message.data)) 
```

## TODO

* Switch from KafkaJS to @confluentinc/kafka-javascript
* Add test suite
