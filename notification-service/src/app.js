require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Eureka } = require('eureka-js-client');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const connectDB = require('./config/db');
const runConsumer = require('./config/kafka');
const emailService = require('./services/emailService');
const notificationRoutes = require('./routes/notificationRoutes');
const Notification = require('./models/Notification');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role'],
    credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 5006;
const HOST = process.env.HOST || 'localhost';
const EUREKA_HOST = process.env.EUREKA_HOST || 'localhost';
const EUREKA_PORT = process.env.EUREKA_PORT || 8761;

/* ===================== Swagger ===================== */
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Notification",
            version: "1.0.0",
            description: "API de gestion des notifications (Email + Kafka)",
        },
        servers: [{ url: `http://${HOST}:${PORT}` }],
        components: {
            securitySchemes: {
                bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
            }
        }
    },
    apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/notifications', notificationRoutes);

connectDB();

/* ===================== Kafka Handler ===================== */
const handleKafkaMessages = async (data, topic) => {
    console.log(`📩 Message reçu du topic: ${topic}`, data);
    try {
        if (topic === 'user-creation-topic') {
            // 1. تسجيل notification فالداتابيز
            const newNotification = new Notification({
                recipient: data.email,
                subject: "Nouvelle demande d'inscription",
                content: `${data.firstName} ${data.lastName} souhaite s'inscrire en tant que ${data.role}`,
                status: 'PENDING',
                source: 'KAFKA',
                type: 'NEW_SIGNUP_REQUEST',
                userId: data.userId,
                role: data.role,
                sentBy: 'SYSTEM'
            });
            await newNotification.save();
            console.log(`✅ Nouvelle demande enregistrée pour: ${data.email}`);

            // 2. إيميل تأكيد التسجيل للمستخدم
            if (data.type === 'NEW_SIGNUP_REQUEST') {
                await emailService.sendSignupConfirmation(data.email, data.firstName);
                console.log(`✅ Email de confirmation envoyé à: ${data.email}`);
            }

            // 3. إيميل التفعيل ملي Admin كايضغط Accept
            if (data.type === 'ACCOUNT_ACTIVATED') {
                await emailService.sendNotification(
                    data.email,
                    "🎉 Félicitations ! Votre compte QribLik est activé",
                    `Bonjour ${data.firstName},\n\nL'administrateur a accepté votre demande.\n\nVous pouvez maintenant vous connecter.\n\nCordialement,\nL'équipe QribLik`,
                    'KAFKA'
                );
                console.log(`✅ Email d'activation envoyé à: ${data.email}`);
            }
        } else if (topic === 'parcel-events') {
            if (data.status === 'CREATED' || data.status === 'PENDING') {
                const parcelNotif = new Notification({
                    recipient: data.clientEmail || "admin@system.com",
                    subject: "📦 Nouveau Colis",
                    content: `Colis ${data.trackingNumber} créé`,
                    status: 'PENDING',
                    source: 'KAFKA',
                    type: 'PARCEL_CREATED',
                    userId: data.clientId || null,
                    role: 'CLIENT',
                    sentBy: 'SYSTEM'
                });
                await parcelNotif.save();
            }
        } else if (topic === 'parcel-update-events') {
            let changeText = '';
            if (data.actionType === 'INFO_UPDATED') {
                if (data.changes === 'العنوان ورقم الهاتف') {
                    changeText = `a modifié l'adresse de "${data.oldAddress}" à "${data.newAddress}" et le téléphone de "${data.oldPhone}" à "${data.newPhone}"`;
                } else if (data.changes === 'العنوان') {
                    changeText = `a modifié l'adresse de "${data.oldAddress}" à "${data.newAddress}"`;
                } else if (data.changes === 'رقم الهاتف') {
                    changeText = `a modifié le téléphone de "${data.oldPhone}" à "${data.newPhone}"`;
                }
            } else if (data.actionType === 'CANCELLED') {
                changeText = `a annulé le colis`;
            }

            const content = `${data.clientName} (${data.clientEmail}) ${changeText} numéro ${data.trackingNumber}`;

            const dispatcherNotif = new Notification({
                recipient: "dispatcher@system.com",
                subject: `📦 ${data.actionType === 'INFO_UPDATED' ? 'Mise à jour des informations du colis' : 'Annulation de colis'}`,
                content, status: 'PENDING', source: 'KAFKA', type: 'PARCEL_UPDATE',
                firstName: data.clientName, email: data.clientEmail,
                userId: null, role: 'DISPATCHER', sentBy: 'SYSTEM'
            });
            await dispatcherNotif.save();
            console.log(`✅ Notification Dispatcher: ${content}`);

            if (data.assignedLivreurId && data.assignedLivreurId !== 'null') {
                const livreurNotif = new Notification({
                    recipient: `livreur_${data.assignedLivreurId}@system.com`,
                    subject: `📦 ${data.actionType === 'INFO_UPDATED' ? 'Mise à jour des informations du colis' : 'Annulation de colis'}`,
                    content, status: 'PENDING', source: 'KAFKA', type: 'PARCEL_UPDATE',
                    firstName: data.clientName, email: data.clientEmail,
                    userId: parseInt(data.assignedLivreurId), role: 'LIVREUR', sentBy: 'SYSTEM'
                });
                await livreurNotif.save();
                console.log(`✅ Notification Livreur: ${data.assignedLivreurId}`);
            }
        }
    } catch (error) {
        console.error("❌ Erreur dans handleKafkaMessages:", error);
    }
};

runConsumer(handleKafkaMessages).catch(err => console.error("❌ Erreur Kafka:", err));

/* ===================== Eureka ===================== */
const client = new Eureka({
    instance: {
        app: 'notification-service',
        instanceId: `notification-service:${process.env.POD_IP}:${process.env.PORT}`,

        // ✅ المهم: نستعمل Pod IP
        hostName: process.env.POD_IP,
        ipAddr: process.env.POD_IP,

        preferIpAddress: true,

        statusPageUrl: `http://${process.env.POD_IP}:${process.env.PORT}`,

        port: {
            '$': process.env.PORT || 5006,
            '@enabled': 'true'
        },

        vipAddress: 'notification-service',

        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },

    eureka: {
        host: process.env.EUREKA_HOST,
        port: process.env.EUREKA_PORT,
        servicePath: '/eureka/apps/',
    },
});

app.listen(PORT, () => {
    console.log(`🚀 Service Notification sur le port ${PORT}`);
    client.start((error) => {
        console.log(error || '✅ Enregistré sur Eureka');
    });
});