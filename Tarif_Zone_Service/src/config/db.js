const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const initDb = async () => {
    try {
        // 1. كنكرييو zones هي الأولى (ضروري)
        const createZonesTable = `
            CREATE TABLE IF NOT EXISTS zones (
                id SERIAL PRIMARY KEY,
                nom_zone VARCHAR(100) UNIQUE NOT NULL,
                statut VARCHAR(20) DEFAULT 'activé'
            );
        `;

        // 2. عاد كنكرييو tarifs اللي كترتبط بـ zones
        const createTarifsTable = `
            CREATE TABLE IF NOT EXISTS tarifs (
                id SERIAL PRIMARY KEY,
                ref VARCHAR(50) UNIQUE NOT NULL, 
                ville VARCHAR(100) UNIQUE NOT NULL, 
                frais_livraison DECIMAL(10, 2) NOT NULL, 
                colis INTEGER DEFAULT 0,
                zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL
            );
        `;

        console.log("⏳ Création des tables en cours...");

        await pool.query(createZonesTable);
        console.log("✅ Table 'zones' créée.");

        await pool.query(createTarifsTable);
        console.log("✅ Table 'tarifs' créée.");

    } catch (err) {
        console.error("❌ Erreur lors de l'initialisation :", err.message);
    }
};

// تنفيذ الكرياسيون
initDb();

module.exports = {
    query: (text, params) => pool.query(text, params),
};