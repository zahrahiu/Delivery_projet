const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gestion_livraisons_db',
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
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

        DO $$
        BEGIN
        BEGIN
        ALTER TABLE "Delivery" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        EXCEPTION
                WHEN duplicate_column THEN NULL;
        END;
        END $$;
    `;
    await pool.query(query);
    console.log('✅ PostgreSQL Table "Delivery" is ready!');
};

module.exports = { pool, initDb };