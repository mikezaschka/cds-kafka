const cds = require('@sap/cds')

module.exports = async () => {
  const kafka = await cds.connect.to('kafka-messaging')
  // kafka.on('someTopic', (message) => {
  //   console.log(message)
  // })
  // kafka.on('someOtherTopic', (message) => {
  //   console.log(message)
  // })
  // kafka.on(/topic-(eu|us)-.*/i, (message) => {
  //   console.log(message)

  //   //ab();
  // })
  kafka.on("*", (message) => {
    console.log(message)
  })
}