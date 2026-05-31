require('./tracing');

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Eureka } = require('eureka-js-client');
const promClient = require('prom-client');
const startConsumer = require('./kafka/consumer');
const { initDb } = require('./config/db');
const { initProducer } = require('./services/deliveryService'); // 🔥 هنا
const deliveryRoutes = require('./routes/deliveryRoutes');

/* ===================== Swagger ===================== */
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

promClient.collectDefaultMetrics({ register: promClient.register });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
const EUREKA_HOST = process.env.EUREKA_HOST || 'localhost';
const EUREKA_PORT = process.env.EUREKA_PORT || 8761;

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

/* ===================== Swagger Config ===================== */
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Delivery Service API",
            version: "1.0.0",
            description: "Microservice Delivery (Eureka + Kafka + DB)"
        },
        servers: [
            {
                url: `http://${HOST}:${PORT}`
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ===================== Routes ===================== */
app.use('/api/deliveries', deliveryRoutes);

/* ===================== Eureka ===================== */
const client = new Eureka({
    instance: {
        app: 'delivery-service',
        instanceId: `delivery-service:${PORT}`,
        hostName: HOST,
        ipAddr: '127.0.0.1',
        statusPageUrl: `http://${HOST}:${PORT}`,
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
    eureka: {
        host: EUREKA_HOST,
        port: EUREKA_PORT,
        servicePath: '/eureka/apps/',
    },
});

/* ===================== START SYSTEM ===================== */
const startServer = async () => {
    try {
        // 1. Initialize DB
        await initDb();
        console.log('✅ Database initialized');

        // 2. Initialize Kafka Producer
        await initProducer();
        console.log('✅ Kafka Producer initialized');

        // 3. Start Kafka Consumer
        await startConsumer();
        console.log('✅ Kafka Consumer started');

        // 4. Start HTTP server
        app.listen(PORT, () => {
            console.log(`🚀 Delivery Service running on port ${PORT}`);
            client.start((error) => {
                if (error) {
                    console.error('❌ Eureka Error:', error);
                } else {
                    console.log('✅ Delivery Service registered on Eureka');
                }
            });
        });
    } catch (err) {
        console.error('❌ Startup error:', err);
    }
};

startServer();