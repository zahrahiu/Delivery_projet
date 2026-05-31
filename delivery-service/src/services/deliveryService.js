const { pool } = require('../config/db');
const kafka = require('../config/kafka');

let producer = null;

const initProducer = async () => {
    console.log('🔧 [1] initProducer called');
    try {
        if (!producer) {
            console.log('🔧 [2] Creating new producer...');
            producer = kafka.producer();
            console.log('🔧 [3] Connecting to Kafka...');
            await producer.connect();
            console.log('✅ [4] Kafka producer connected successfully');
        } else {
            console.log('🔧 [4] Producer already exists');
        }
        return producer;
    } catch (err) {
        console.error('❌ Producer connection failed:', err);
        throw err;
    }
};

// 🔥 دالة وحيدة لبعث الأحداث
const sendAssignmentEvent = async (trackingNumber, livreurId, action) => {
    console.log(`📤 [sendAssignmentEvent] Called: ${action} for ${trackingNumber}`);
    try {
        await initProducer();
        const event = {
            trackingNumber: trackingNumber,
            livreurId: livreurId,
            action: action,
            timestamp: new Date().toISOString()
        };
        console.log(`📤 [sendAssignmentEvent] Event:`, event);
        await producer.send({
            topic: 'delivery-assignments',
            messages: [{ value: JSON.stringify(event) }]
        });
        console.log(`✅ [sendAssignmentEvent] Event sent successfully: ${action} for ${trackingNumber}`);
        return true;
    } catch (err) {
        console.error('❌ [sendAssignmentEvent] Failed:', err);
        return false;
    }
};

const processParcel = async (parcelData) => {
    console.log("📦 Processing parcel in Delivery Service:", parcelData);
    const now = new Date();

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

// 🔥 التعديل الرئيسي هنا - نزيل التكرار
const assignLivreur = async (trackingNumber, livreurId) => {
    console.log(`🚚 Assigning livreur ${livreurId} to parcel ${trackingNumber}`);

    const checkQuery = `SELECT * FROM "Delivery" WHERE "trackingNumber" = $1`;
    const checkResult = await pool.query(checkQuery, [trackingNumber]);

    let result;
    if (checkResult.rowCount === 0) {
        console.log(`⚠️ Parcel ${trackingNumber} not found, creating it first...`);
        const now = new Date();
        const uniqueId = `${Date.now()}-${trackingNumber}`;
        const insertQuery = `
            INSERT INTO "Delivery" (id, "trackingNumber", status, "assignedLivreur", "createdAt", "updatedAt")
            VALUES ($1, $2, 'ASSIGNED', $3, $4, $5)
                RETURNING *
        `;
        const insertResult = await pool.query(insertQuery, [uniqueId, trackingNumber, livreurId, now, now]);
        result = insertResult.rows[0];
        console.log(`✅ Parcel ${trackingNumber} created and assigned`);
    } else {
        const query = `
            UPDATE "Delivery"
            SET "assignedLivreur" = $1, status = 'ASSIGNED', "updatedAt" = NOW()
            WHERE "trackingNumber" = $2
                RETURNING *
        `;
        const updateResult = await pool.query(query, [livreurId, trackingNumber]);
        if (updateResult.rowCount === 0) {
            throw new Error(`Colis ${trackingNumber} non trouvé dans Delivery Service`);
        }
        result = updateResult.rows[0];
    }

    // 🔥 بعث event واحد فقط لـ Parcel Service
    const eventSent = await sendAssignmentEvent(trackingNumber, livreurId, 'ASSIGN');
    if (!eventSent) {
        console.warn(`⚠️ Event not sent but assignment saved in DB for ${trackingNumber}`);
    }

    console.log(`✅ Parcel ${trackingNumber} assigned to livreur ${livreurId}`);
    return result;
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

const unassignLivreur = async (trackingNumber) => {
    console.log(`🚚 Removing livreur from parcel ${trackingNumber}`);

    const query = `
        UPDATE "Delivery"
        SET "assignedLivreur" = NULL, status = 'PENDING', "updatedAt" = NOW()
        WHERE "trackingNumber" = $1
            RETURNING *
    `;
    const result = await pool.query(query, [trackingNumber]);

    if (result.rowCount === 0) {
        console.log(`⚠️ Parcel ${trackingNumber} not found in Delivery Service`);
        return null;
    }

    // 🔥 بعث event واحد فقط
    const eventSent = await sendAssignmentEvent(trackingNumber, null, 'UNASSIGN');
    if (!eventSent) {
        console.warn(`⚠️ Event not sent but unassignment saved in DB for ${trackingNumber}`);
    }

    console.log(`✅ Livreur removed from parcel ${trackingNumber}`);
    return result.rows[0];
};

module.exports = {
    processParcel,
    assignLivreur,
    updateDeliveryStatus,
    unassignLivreur,
    initProducer
};