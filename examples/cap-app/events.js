

(async () => {
  const cds = require('@sap/cds')
  const messaging = await cds.connect.to('kafka-messaging')
  //await messaging.emit('topic-eu-A', { message: 'Hello World' });
  await messaging.emit('someTopics', { message: 'Hello World' });
})();   

