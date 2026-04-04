require('dotenv').config();
const express = require('express');
const Eureka = require('eureka-js-client').Eureka; // <--- زيدي هادي
const startConsumer = require('./kafka/consumer');
const { initDb } = require('./config/db');
const { assignDelivery } = require('./controllers/deliveryController');
const authMiddleware = require("./middlewares/auth");
const hasRole = require("./middlewares/hasRole");

const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());


const PORT = 3001;

const client = new Eureka({
    instance: {
        app: 'delivery-service', // تبديل لـ ناقص
        instanceId: `delivery-service:${PORT}`,
        hostName: 'localhost',
        ipAddr: '127.0.0.1',
        statusPageUrl: `http://localhost:${PORT}`,
        port: {
            '$': PORT,
            '@enabled': 'true',
        },
        vipAddress: 'delivery-service',
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: { host: 'localhost', port: 8761, servicePath: '/eureka/apps/' },
});

// 2. الـ Routes (بـ السيكوريتي ديالهم)
app.post('/deliveries/:id/assign',
    authMiddleware,
    hasRole('ROLE_DISPATCHER'),
    assignDelivery
);

// 3. تشغيل الـ Database و Kafka و Eureka
initDb().then(() => {
    startConsumer().catch(console.error);

    app.listen(PORT, () => {
        console.log(`🚀 Delivery Service running on port ${PORT}`);

        // تسجيل السيرفيس في Eureka
        client.start((error) => {
            if (error) {
                console.error('❌ Erreur Eureka (Delivery):', error);
            } else {
                console.log('✅ Delivery Service enregistré sur Eureka !');
            }
        });
    });
});