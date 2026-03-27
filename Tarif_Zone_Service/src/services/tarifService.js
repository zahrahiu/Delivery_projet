const db = require('../config/db');

exports.getTarifByVille = async (ville) => {
    const result = await db.query(
        'SELECT * FROM tarifs WHERE UPPER(ville) = UPPER($1)',
        [ville]
    );
    return result.rows[0];
};

// دالة التعديل الشامل (بما فيها السمية)
exports.updateTarif = async (id, data) => {
    const { ref, ville, frais_livraison } = data;
    const query = `
        UPDATE tarifs
        SET ref = $1, ville = $2, frais_livraison = $3
        WHERE id = $4
            RETURNING *;
    `;
    const result = await db.query(query, [ref, ville, frais_livraison, id]);
    return result.rows[0];
};


exports.getAllTarifs = async () => {
    const result = await db.query('SELECT * FROM tarifs ORDER BY ville ASC');
    return result.rows;
};

exports.deleteTarif = async (id) => {
    await db.query('UPDATE tarifs SET zone_id = NULL WHERE id = $1', [id]);

    const result = await db.query('DELETE FROM tarifs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
};


exports.createTarif = async (data) => {
    const { ref, ville, frais_livraison, colis } = data;
    const query = `
        INSERT INTO tarifs (ref, ville, frais_livraison, colis)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const result = await db.query(query, [ref, ville, frais_livraison, colis || 0]);
    return result.rows[0];
};