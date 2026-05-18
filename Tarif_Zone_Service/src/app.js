require('./tracing');

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Eureka } = require('eureka-js-client');
const promClient = require('prom-client');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const tarifRoutes = require('./routes/tarifRoutes');
const zoneRoutes = require('./routes/zoneRoutes');

const app = express();
promClient.collectDefaultMetrics({ register: promClient.register });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5005;
const HOST = process.env.HOST || 'localhost';
const EUREKA_HOST = process.env.EUREKA_HOST || 'localhost';
const EUREKA_PORT = process.env.EUREKA_PORT || 8761;

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});


/* ===================== Swagger Config ===================== */
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Tarif Zone API",
            version: "1.0.0",
            description: "API gestion des tarifs et zones",
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

/* ===================== Routes ===================== */
app.use('/api/tarifs', tarifRoutes);
app.use('/api/zones', zoneRoutes);

/* ===================== Eureka ===================== */
const client = new Eureka({
    instance: {
        app: 'tarif-zone-service',
        instanceId: `tarif-zone-service:${PORT}`,
        hostName: HOST,
        ipAddr: '127.0.0.1',
        statusPageUrl: `http://${HOST}:${PORT}`,
        port: { '$': PORT, '@enabled': 'true' },
        vipAddress: 'tarif-zone-service',
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: {
        host: EUREKA_HOST,
        port: EUREKA_PORT,
        servicePath: '/eureka/apps/',
    },
});

app.listen(PORT, () => {
    console.log(`🚀 Service démarré sur le port ${PORT}`);
    client.start((error) => {
        console.log(error || '✅ Service enregistré sur Eureka !');
    });
});