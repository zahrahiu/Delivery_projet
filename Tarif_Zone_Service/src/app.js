const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Eureka = require('eureka-js-client').Eureka; // <--- زيدي هادي

const tarifRoutes = require('./routes/tarifRoutes');
const zoneRoutes = require('./routes/zoneRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tarifs', tarifRoutes);
app.use('/api/zones', zoneRoutes);


const PORT = process.env.PORT || 5005;

const client = new Eureka({
    instance: {
        app: 'tarif-zone-service', // تبديل لـ ناقص
        instanceId: `tarif-zone-service:${PORT}`,
        hostName: 'localhost',
        ipAddr: '127.0.0.1',
        statusPageUrl: `http://localhost:${PORT}`,
        port: {
            '$': PORT,
            '@enabled': 'true',
        },
        vipAddress: 'tarif-zone-service',
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
    console.log(`🚀 Tarif_Zone_Service démarré sur le port ${PORT}`);

    // تشغيل التسجيل في Eureka
    client.start((error) => {
        console.log(error || '✅ Trif_Zone_Service enregistré sur Eureka !');
    });
});