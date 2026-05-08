const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gestion_livraisons_db',  // lowercase
    password: process.env.DB_PASSWORD || 'zahra123',
    port: process.env.DB_PORT || 5432,
});

const initDb = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS "Delivery" (
                                                  id VARCHAR(255) PRIMARY KEY,
            "trackingNumber" VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) NOT NULL,
            "assignedLivreur" VARCHAR(255),
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
    `;
    await pool.query(query);
    console.log('✅ PostgreSQL Table "Delivery" is ready!');
};

module.exports = { pool, initDb };