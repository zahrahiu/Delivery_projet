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
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role'],
    credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 5006;

/* ===================== Configuration Swagger ===================== */
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Notification",
            version: "1.0.0",
            description: "API de gestion des notifications (Email + Kafka)",
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/notifications', notificationRoutes);

connectDB();

/* ===================== Gestionnaire Kafka ===================== */
const handleKafkaMessages = async (data, topic) => {
    console.log(`📩 Message reçu du topic: ${topic}`, data);

    try {
        // Topic: Inscription des utilisateurs
        if (topic === 'user-creation-topic') {
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

            if (data.type === 'ACCOUNT_ACTIVATED') {
                await emailService.sendNotification(
                    data.email,
                    "Félicitations ! Votre compte QribLik est activé",
                    `Bonjour ${data.firstName}, l'administrateur a accepté votre demande. Vous pouvez maintenant vous connecter.`,
                    'KAFKA'
                );
                console.log(`✅ Email d'activation envoyé à: ${data.email}`);
            }
        }
        // Topic: Événements des colis
        else if (topic === 'parcel-events') {
            if (data.status === 'CREATED' || data.status === 'PENDING') {
                const recipientEmail = data.clientEmail;
                if (recipientEmail) {
                    await emailService.sendNotification(
                        recipientEmail,
                        "📦 Confirmation de colis",
                        `Numéro de suivi: ${data.trackingNumber}`,
                        'KAFKA'
                    );
                }
            }
        }
        // Topic: Mises à jour des colis par le client
        else if (topic === 'parcel-update-events') {
            // Construction du texte selon les modifications
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

            // Notification pour le Dispatcher
            const dispatcherNotif = new Notification({
                recipient: "dispatcher@system.com",
                subject: `📦 ${data.actionType === 'INFO_UPDATED' ? 'Mise à jour des informations du colis' : 'Annulation de colis'}`,
                content: content,
                status: 'PENDING',
                source: 'KAFKA',
                type: 'PARCEL_UPDATE',
                firstName: data.clientName,
                email: data.clientEmail,
                userId: null,
                role: 'DISPATCHER',
                sentBy: 'SYSTEM'
            });
            await dispatcherNotif.save();
            console.log(`✅ Notification Dispatcher: ${content}`);

            // Notification pour le Livreur (si assigné)
            if (data.assignedLivreurId && data.assignedLivreurId !== 'null') {
                const livreurNotif = new Notification({
                    recipient: `livreur_${data.assignedLivreurId}@system.com`,
                    subject: `📦 ${data.actionType === 'INFO_UPDATED' ? 'Mise à jour des informations du colis' : 'Annulation de colis'}`,
                    content: content,
                    status: 'PENDING',
                    source: 'KAFKA',
                    type: 'PARCEL_UPDATE',
                    firstName: data.clientName,
                    email: data.clientEmail,
                    userId: parseInt(data.assignedLivreurId),
                    role: 'LIVREUR',
                    sentBy: 'SYSTEM'
                });
                await livreurNotif.save();
                console.log(`✅ Notification Livreur: ${data.assignedLivreurId}`);
            }
        }
    } catch (error) {
        console.error("❌ Erreur dans handleKafkaMessages:", error);
    }
};

// Démarrage du consumer Kafka
runConsumer(handleKafkaMessages).catch(err =>
    console.error("❌ Erreur Kafka:", err)
);

/* ===================== Eureka ===================== */
const client = new Eureka({
    instance: {
        app: 'notification-service',
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
    eureka: {
        host: 'localhost',
        port: 8761,
        servicePath: '/eureka/apps/',
    },
});

app.listen(PORT, () => {
    console.log(`🚀 Service Notification sur le port ${PORT}`);
    client.start((error) => {
        console.log(error || '✅ Enregistré sur Eureka');
    });
});