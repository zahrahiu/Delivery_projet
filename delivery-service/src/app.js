const express = require('express');
const startConsumer = require('./kafka/consumer');
const { initDb } = require('./config/db');
const { assignDelivery } = require('./controllers/deliveryController');
const authMiddleware = require("./middlewares/auth");
const hasRole = require("./middlewares/hasRole");

const app = express();

// 1. هادا هو اللول! (باش يقرأ الـ JSON من Postman)
app.use(express.json());

// 2. الـ Routes (بـ السيكوريتي ديالهم)
app.post('/deliveries/:id/assign',
    authMiddleware,
    hasRole('ROLE_DISPATCHER'), // تأكدي بلي فـ التوكين سميتها ROLE_DISPATCHER
    assignDelivery
);

// 3. تشغيل الـ Database و Kafka
initDb().then(() => {
    startConsumer().catch(console.error);
    app.listen(3001, () => {
        console.log('🚀 Delivery Service running on port 3001');
    });
});