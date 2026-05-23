// src/services/deliveryService.js
const { pool } = require('../config/db');

const processParcel = async (parcelData) => {
    console.log("📦 Processing parcel in Delivery Service:", parcelData);

    const now = new Date();

    // 🔥 Vérifier si le colis existe déjà
    const checkQuery = `SELECT * FROM "Delivery" WHERE "trackingNumber" = $1`;
    const checkResult = await pool.query(checkQuery, [parcelData.trackingNumber]);

    if (checkResult.rowCount > 0) {
        console.log(`📦 Parcel ${parcelData.trackingNumber} already exists, updating...`);
        const updateQuery = `
            UPDATE "Delivery"
            SET status = $1, "updatedAt" = NOW()
            WHERE "trackingNumber" = $2
                RETURNING *
        `;
        const result = await pool.query(updateQuery, [parcelData.status || 'PENDING', parcelData.trackingNumber]);
        return result.rows[0];
    }

    // ✅ Créer un nouvel enregistrement
    const query = `
        INSERT INTO "Delivery" (id, "trackingNumber", status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5)
            RETURNING *
    `;

    const uniqueId = `${Date.now()}-${parcelData.trackingNumber}`;
    const values = [
        uniqueId,
        parcelData.trackingNumber,
        parcelData.status || 'PENDING',
        now,
        now
    ];

    const result = await pool.query(query, values);
    console.log(`✅ Parcel ${parcelData.trackingNumber} saved in Delivery Service`);
    return result.rows[0];
};

const assignLivreur = async (trackingNumber, livreurId) => {
    console.log(`🚚 Assigning livreur ${livreurId} to parcel ${trackingNumber}`);

    // 🔥 Vérifier d'abord si le colis existe
    const checkQuery = `SELECT * FROM "Delivery" WHERE "trackingNumber" = $1`;
    const checkResult = await pool.query(checkQuery, [trackingNumber]);

    if (checkResult.rowCount === 0) {
        console.log(`⚠️ Parcel ${trackingNumber} not found, creating it first...`);

        // Créer le colis s'il n'existe pas
        const now = new Date();
        const uniqueId = `${Date.now()}-${trackingNumber}`;
        const insertQuery = `
            INSERT INTO "Delivery" (id, "trackingNumber", status, "assignedLivreur", "createdAt", "updatedAt")
            VALUES ($1, $2, 'ASSIGNED', $3, $4, $5)
            RETURNING *
        `;
        const insertResult = await pool.query(insertQuery, [uniqueId, trackingNumber, livreurId, now, now]);
        console.log(`✅ Parcel ${trackingNumber} created and assigned`);
        return insertResult.rows[0];
    }

    // ✅ Mettre à jour l'assignation
    const query = `
        UPDATE "Delivery"
        SET "assignedLivreur" = $1, status = 'ASSIGNED', "updatedAt" = NOW()
        WHERE "trackingNumber" = $2
            RETURNING *
    `;
    const result = await pool.query(query, [livreurId, trackingNumber]);

    if (result.rowCount === 0) {
        throw new Error(`Colis ${trackingNumber} non trouvé dans Delivery Service`);
    }

    console.log(`✅ Parcel ${trackingNumber} assigned to livreur ${livreurId}`);
    return result.rows[0];
};

const updateDeliveryStatus = async (trackingNumber, status) => {
    const query = `
        UPDATE "Delivery"
        SET status = $1, "updatedAt" = NOW()
        WHERE "trackingNumber" = $2
            RETURNING *
    `;
    const result = await pool.query(query, [status, trackingNumber]);
    return result.rows[0];
};

module.exports = { processParcel, assignLivreur, updateDeliveryStatus };