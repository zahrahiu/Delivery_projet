const mongoose = require('mongoose');

const connectDB = async () => {
    // HOST و PORT كيجيو من .env بحال اللي درتي فـ Python
    const MONGO_HOST = process.env.DB_HOST || 'localhost';
    const MONGO_PORT = process.env.DB_PORT || 27017;
    const DB_NAME = 'notification_db';

    const MONGO_URI = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${DB_NAME}`;

    try {
        await mongoose.connect(MONGO_URI);
        console.log(`✅ MongoDB Connecté sur: ${MONGO_URI}`);
    } catch (err) {
        console.error('❌ Erreur de connexion MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;