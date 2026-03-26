const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const runConsumer = async (onMessageReceived) => {
    await consumer.connect();
    console.log("✅ Kafka Consumer Connecté...");

    // 1. كنتصنتو لـ كاع الـ Topics اللي محتاجين
    await consumer.subscribe({ topics: ['parcel-events', 'user-creation-topic'], fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, message }) => { // زدنا topic هنا
            try {
                const data = JSON.parse(message.value.toString());
                console.log(`📩 Message reçu de Java sur [${topic}]:`, data);

                // 2. كنصيفطو الداتا والـ topic لـ handleKafkaMessages
                await onMessageReceived(data, topic);
            } catch (err) {
                console.error("❌ Erreur de parsing JSON:", err);
            }
        },
    });
};

module.exports = runConsumer;