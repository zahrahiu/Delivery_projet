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

const assignLivreur = async (trackingNumber, livreurId) => {
    const query = `UPDATE "Delivery" SET "assignedLivreur" = $1 WHERE "trackingNumber" = $2 RETURNING *`;
    const result = await pool.query(query, [livreurId, trackingNumber]);

    if (result.rowCount === 0) {
        throw new Error("Colis non trouvé dans Delivery Service");
    }
    return result.rows[0];
};

module.exports = { processParcel, assignLivreur };