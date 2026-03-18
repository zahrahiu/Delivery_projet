const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'delivery-service',
    brokers: ['localhost:9092'] // تأكدي أن الكافكا عندك خدام فهاد البورت
});

module.exports = kafka;