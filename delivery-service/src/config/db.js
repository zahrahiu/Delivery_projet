const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Gestion_Livraisons_db',
    password: 'zahra123',
    port: 5432,
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