const cds = require('@sap/cds')
cds.test.in(__dirname)
const servicePath = require("path").resolve(__dirname, "./srv/");
console.log(servicePath);
const { expect, data } = cds.test(servicePath);

describe('KafkaService', () => {
    it('should start listening on cds topic', async () => {
        const messaging = await cds.connect.to('messaging');
        const ownSrv = await cds.connect.to('OurService');

        
    })
})