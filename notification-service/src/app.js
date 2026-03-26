require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const runConsumer = require('./config/kafka');
const emailService = require('./services/emailService');
const notificationRoutes = require('./routes/notificationRoutes'); // زيدي هاد السطر ضروري!

const app = express();
app.use(express.json());

// الربط ديال الـ Routes
app.use('/api/notifications', notificationRoutes);


connectDB();

const handleKafkaMessages = async (data, topic) => {
    console.log(`📩 Analyse du message reçu du topic: ${topic}`);

    if (topic === 'user-creation-topic') {
        if (data.email) {
            await emailService.sendNotification(
                data.email,
                "Bienvenue chez Qrib Lik - Vos accès au système",
                `Bonjour ${data.firstName || 'Utilisateur'},\n\n` +
                `Votre compte a été créé avec succès.\n` +
                `Voici vos identifiants pour vous connecter :\n\n` +
                `- Email : ${data.email}\n` +
                `- Mot de passe : ${data.password}\n\n` +
                `Lien de connexion : http://localhost:3000/login\n\n` +
                `Merci de changer votre mot de passe après votre première connexion.`,
                'KAFKA'
            );
            console.log(`✅ Email de bienvenue envoyé à: ${data.email}`);
        } else {
            console.error("❌ Données utilisateur manquantes (email)");
        }
    }

    // --- الحالة 2: تحديث حالة الكولي (Parcel Tracking) ---
    else if (topic === 'parcel-events') {
        const statusToNotify = ['PENDING', 'CREATED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];

        if (statusToNotify.includes(data.status)) {
            const recipientEmail = data.clientEmail || data.senderEmail;

            if (recipientEmail) {
                await emailService.sendNotification(
                    recipientEmail,
                    `Mise à jour de votre colis ${data.trackingNumber}`,
                    `Bonjour ${data.senderName || 'Client'},\n\n` +
                    `Le statut de votre colis (Réf: ${data.trackingNumber}) est désormais : ${data.status}.\n` +
                    `Destination : ${data.deliveryAddress}.\n\n` +
                    `L'équipe Qrib Lik.`,
                    'KAFKA'
                );
            } else {
                console.error("❌ Email introuvable pour le colis:", data.trackingNumber);
            }
        }
    }
};

// تشغيل الـ Consumer مع تمرير الـ callback
runConsumer(handleKafkaMessages).catch(err => console.error("❌ Kafka Error:", err));
// 3. تشغيل السيرفر
const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
    console.log(`🚀 Notification Service démarre sur le port ${PORT}`);
});