const cds = require('@sap/cds');

class PublicService extends cds.ApplicationService {
    init() {
        this.on('triggerEvent', async (req) => {
            const kafka = await cds.connect.to('kafka-messaging');
            await kafka.emit('some-topic', { subject: 'Hello World' });
            req.reply('Message to Kafka delivered');
        });
        return super.init()
    }
}

module.exports = PublicService