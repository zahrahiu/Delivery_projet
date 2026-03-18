const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// الدالة اللي غتكريي الجدول أوتوماتيكياً
const initDb = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tarifs (
            id SERIAL PRIMARY KEY,
            ville VARCHAR(100) UNIQUE NOT NULL,
            prix_standard DECIMAL(10, 2) NOT NULL,
            prix_premium DECIMAL(10, 2) NOT NULL
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log("✅ Table 'tarifs' est prête (créée ou déjà existante)");
    } catch (err) {
        console.error("❌ Erreur lors de la création de la table:", err.message);
    }
};

pool.on('connect', () => {
    console.log('✅ Connecté à la base de données PostgreSQL');
});

// تنفيذ عملية الكرياسيون غير يشعل السيرفر
initDb();

module.exports = {
    query: (text, params) => pool.query(text, params),
};