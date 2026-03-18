const { pool } = require('../config/db');

const processParcel = async (parcelData) => {
    const query = `
        INSERT INTO "Delivery" (id, "trackingNumber", status, "updatedAt")
        VALUES ($1, $2, $3, NOW())
            ON CONFLICT (id) DO NOTHING
    `;
    // تأكدي أننا كنصيفطو 3 ديال القيم (id, trackingNumber, status)
    const values = [parcelData.trackingNumber, parcelData.trackingNumber, parcelData.status || 'PENDING'];
    return await pool.query(query, values);
};

const assignLivreur = async (id, livreurId) => {
    const query = `UPDATE "Delivery" SET "assignedLivreur" = $1 WHERE id = $2`;
    return await pool.query(query, [livreurId, id]);
};

module.exports = { processParcel, assignLivreur };