// src/kafka/consumer.js
const kafka = require('../config/kafka');
const { processParcel } = require('../services/deliveryService'); // هنا عيطنا للـ Service
const consumer = kafka.consumer({ groupId: 'delivery-group' });

const startConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'parcel-events', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const parcelData = JSON.parse(message.value.toString());
            console.log('✅ Received new parcel, saving to DB...');
            await processParcel(parcelData); // خدمنا بالـ Service
        },
    });
};

module.exports = startConsumer;