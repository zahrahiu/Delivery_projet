const db = require('../config/db');


// جلب كاع المناطق مع لستة ديال المدن اللي تابعين ليها
exports.getAllZones = async () => {
    const query = `
        SELECT z.*,
               -- كنجمعو غير سميات المدن ف Array باش نعرضوهم ف الجدول بسهولة
               COALESCE(json_agg(t.ville) FILTER (WHERE t.id IS NOT NULL), '[]') as villes_list
        FROM zones z
                 LEFT JOIN tarifs t ON z.id = t.zone_id
        GROUP BY z.id
        ORDER BY z.nom_zone ASC;
    `;
    const result = await db.query(query);
    return result.rows;
};

// ربط مدينة بمنطقة (Affectation)
exports.assignVilleToZone = async (zoneId, villeId) => {
    const query = 'UPDATE tarifs SET zone_id = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(query, [zoneId, villeId]);
    return result.rows[0];
};

// إضافة منطقة جديدة
exports.createZone = async (nom_zone) => {
    const query = 'INSERT INTO zones (nom_zone) VALUES ($1) RETURNING *';
    const result = await db.query(query, [nom_zone]);
    return result.rows[0];
};

// إزالة مدينة من أي منطقة (ترجيح zone_id لـ null)
exports.unassignVilleFromZone = async (villeId) => {
    const query = 'UPDATE tarifs SET zone_id = NULL WHERE id = $1 RETURNING *';
    const result = await db.query(query, [villeId]);
    return result.rows[0];
};

exports.deleteZone = async (zoneId) => {
    // 1. فك الارتباط مع المدن
    await db.query('UPDATE tarifs SET zone_id = NULL WHERE zone_id = $1', [zoneId]);

    // 2. مسح المنطقة
    const query = 'DELETE FROM zones WHERE id = $1 RETURNING *';
    const result = await db.query(query, [zoneId]);
    return result.rows[0];
};

