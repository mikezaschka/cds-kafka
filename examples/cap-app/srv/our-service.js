const cds = require('@sap/cds')

module.exports = async () => {

  const kafka = await cds.connect.to('kafka-messaging')
  // const srv = await cds.connect.to('OurService')
  // srv.on("triggerEvent", async (req) => {
  //   await kafka.emit('cap.test.object.created.v1', { message: 'Hello World' });
  // });

  // Observe a topic
  // kafka.on('someTopic', (message) => console.log(message))

  // Observe multiple topics via a pattern
  kafka.on(/topic-(A|B|C)-.*/i, (message) => console.log(message))

  // Observe all topics
  // kafka.on("*", (message) => console.log(message))

}