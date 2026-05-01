const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Eureka } = require('eureka-js-client');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const tarifRoutes = require('./routes/tarifRoutes');
const zoneRoutes = require('./routes/zoneRoutes');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5005;

/* ===================== Swagger Config ===================== */
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Tarif Zone API",
            version: "1.0.0",
            description: "API gestion des tarifs et zones",
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

/* ===================== Routes ===================== */
app.use('/api/tarifs', tarifRoutes);
app.use('/api/zones', zoneRoutes);

/* ===================== Eureka ===================== */
const client = new Eureka({
    instance: {
        app: 'tarif-zone-service',
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
    console.log(`🚀 Service démarré sur le port ${PORT}`);

    client.start((error) => {
        console.log(error || '✅ Service enregistré sur Eureka !');
    });
});