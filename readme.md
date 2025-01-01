# Welcome to cds-kafka


## About this project

CDS plugin providing integration with Apache Kafka.



## Table of Contents

- [About this project](#about-this-project)
- [Requirements](#requirements)
- [Setup](#setup)
- [Support, Feedback, Contributing](#support-feedback-contributing)
- [Code of Conduct](#code-of-conduct)
- [Licensing](#licensing)



## Requirements

See [Getting Started](https://cap.cloud.sap/docs/get-started/in-a-nutshell) on how to jumpstart your development and grow as you go with SAP Cloud Application Programming Model.


## Setup

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
        "brokers": [
          "localhost:29092"
        ],
      },
      "kafka-service": {
        "impl": "cds-kafka"
      }
    }
  }
```
