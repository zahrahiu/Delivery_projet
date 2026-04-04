require('dotenv').config();
const express = require('express');
const Eureka = require('eureka-js-client').Eureka; // مكتبة يوريكا
const connectDB = require('./config/db');
const runConsumer = require('./config/kafka');
const emailService = require('./services/emailService');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
app.use(express.json());

// الربط ديال الـ Routes
app.use('/api/notifications', notificationRoutes);


const PORT = process.env.PORT || 5006;

const client = new Eureka({
    instance: {
        app: 'notification-service', // تبديل لـ ناقص
        instanceId: `notification-service:${PORT}`,
        hostName: 'localhost',
        ipAddr: '127.0.0.1',
        statusPageUrl: `http://localhost:${PORT}`,
        port: {
            '$': PORT,
            '@enabled': 'true',
        },
        vipAddress: 'notification-service',
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: { host: 'localhost', port: 8761, servicePath: '/eureka/apps/' },
});


// الربط مع الداتابيز
connectDB();

// معالجة الرسائل اللي جاية من Kafka
const handleKafkaMessages = async (data, topic) => {
    console.log(`📩 Analyse du message reçu du topic: ${topic}`);

    // حالة 1: ترحيب بمستخدم جديد
    if (topic === 'user-creation-topic') {
        if (data.email) {
            await emailService.sendNotification(
                data.email,
                "Bienvenue chez Qrib Lik - Vos accès au système",
                `Bonjour ${data.firstName || 'Utilisateur'},\n\n` +
                `Votre compte a été créé avec succès.\n` +
                `Voici vos identifiants :\n- Email : ${data.email}\n- Mot de passe : ${data.password}\n\n` +
                `Lien : http://localhost:3000/login`,
                'KAFKA'
            );
            console.log(`✅ Email de bienvenue envoyé à: ${data.email}`);
        }
    }

    // حالة 2: تتبع الكولي (Parcel Events)
    else if (topic === 'parcel-events') {
        const statusToNotify = ['PENDING', 'CREATED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
        if (statusToNotify.includes(data.status)) {
            const recipientEmail = data.clientEmail || data.senderEmail;
            if (recipientEmail) {
                await emailService.sendNotification(
                    recipientEmail,
                    `Mise à jour de votre colis ${data.trackingNumber}`,
                    `Bonjour,\n\nLe statut de votre colis (${data.trackingNumber}) est : ${data.status}.\n\nL'équipe Qrib Lik.`,
                    'KAFKA'
                );
            }
        }
    }
};

// تشغيل Kafka Consumer
runConsumer(handleKafkaMessages).catch(err => console.error("❌ Kafka Error:", err));

// تشغيل السيرفر وتسجيله في Eureka
app.listen(PORT, () => {
    console.log(`🚀 Notification Service démarre sur le port ${PORT}`);

    client.start((error) => {
        if (error) {
            console.error('❌ Erreur lors de l\'enregistrement sur Eureka:', error);
        } else {
            console.log('✅ Notification Service enregistré sur Eureka !');
        }
    });
});