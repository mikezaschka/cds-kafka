# Welcome to cds-kafka


## About this project

This project is a plugin for the SAP Cloud Application Programming Model (CAP) providing native integration with Apache Kafka as the messaging service.


## Table of Contents

- [About this project](#about-this-project)
- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)


## Requirements

See [Getting Started](https://cap.cloud.sap/docs/get-started/in-a-nutshell) on how to jumpstart your development and grow as you go with SAP Cloud Application Programming Model.


## Setup and Usage

Install the plugin via:

```bash
npm add cds-kafka
```

Please follow the [guide on messaging](https://cap.cloud.sap/docs/guides/messaging/) to get an overview over the messaging concepts of CAP.

```jsonc
"cds": {
    "requires": {
      "kafka-messaging": {
        "kind": "kafka-service",
        "credentials": {
            "brokers": [
                "localhost:29092"
            ]
        }
      },
      "kafka-service": {
        "impl": "cds-kafka"
      }
    }
  }
```

### Sending events

Sending an event is done by using standard CAP functionality:

```javascript
const kafka = await cds.connect.to('kafka-messaging') 
await kafka.emit('some-topic', { message: 'Hello World' });
````

There is no special functionality available 

Since CAP is abstracting the event handling away from the underlying transport, the usage of kafka-based events is similar as any other adapter, with the exception of the .


```javascript
const messaging = await cds.connect.to('kafka-messaging') 
messaging.on('some-topic', (message) => console.log(message)) 
````

