const { Kafka } = require('kafkajs');

// 1. تعريف Kafka هو الأول
const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// 2. تعريف الـ Consumer مرة واحدة فقط وبـ Group ID جديد
const consumer = kafka.consumer({ groupId: 'notification-group-v4' });

const runConsumer = async (onMessageReceived) => {
    try {
        await consumer.connect();
        console.log("✅ Kafka Consumer Connecté...");

        // 3. الاشتراك في الـ Topics
        await consumer.subscribe({
            topics: ['parcel-events', 'user-creation-topic', 'parcel-update-events'],
            fromBeginning: false
        });

        await consumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const data = JSON.parse(message.value.toString());
                    console.log(`📩 Message reçu de Java sur [${topic}]:`, data);

                    // إرسال البيانات للمعالج
                    await onMessageReceived(data, topic);
                } catch (err) {
                    console.error("❌ Erreur de parsing JSON:", err.message);
                }
            },
        });
    } catch (error) {
        console.error("❌ Erreur de connexion au Consumer Kafka:", error);
    }
};

module.exports = runConsumer;