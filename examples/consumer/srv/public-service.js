const cds = require('@sap/cds');
const { INSERT } = require('@sap/cds/lib/ql/cds-ql');

module.exports = async () => {

  const { Messages } = cds.entities('cap.kafka.db');

  const kafka = await cds.connect.to('kafka-messaging')
  kafka.on("*", async (message) => {
    await INSERT.into(Messages).entries({
      ID: message.headers['ce-id'],
      data: JSON.stringify(message.data),
      headers: JSON.stringify(message.headers),
    });
  });

  // const srv = await cds.connect.to('OurService')
  // srv.on("triggerEvent", async (req) => {
  //   await kafka.emit('cap.test.object.created.v1', { message: 'Hello World' });
  // });

  // Observe a topic
  // kafka.on('someTopic', (message) => console.log(message))

  // Observe multiple topics via a pattern


  // Observe all topics
  // kafka.on("*", (message) => console.log(message))

}