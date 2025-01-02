

(async () => {
  const cds = require('@sap/cds')
  const messaging = await cds.connect.to('kafka-messaging')
  await messaging.emit({
    event: 'ObjectCreated',
    data: { subject: 'Hello World' },
    headers: {
      '@kafka.key': '1234',
      '@kafka.partition': "0",
      '@kafka.topic': 'topic-A-1',
    }
  });
})();

