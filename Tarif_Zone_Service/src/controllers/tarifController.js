const db = require('../config/db');

// جلب الثمن على حسب المدينة
exports.getTarifByVille = async (req, res) => {
    const { ville } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM tarifs WHERE UPPER(ville) = UPPER($1)',
            [ville]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "المدينة غير مسجلة في النظام" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "خطأ في السيرفر: " + err.message });
    }
};

// إضافة أو تحديث ثمن مدينة (لـ Admin/Dispatcher)
exports.upsertTarif = async (req, res) => {
    const { ville, prix_standard, prix_premium } = req.body;
    try {
        const query = `
            INSERT INTO tarifs (ville, prix_standard, prix_premium)
            VALUES ($1, $2, $3)
            ON CONFLICT (ville) DO UPDATE 
            SET prix_standard = $2, prix_premium = $3
            RETURNING *;
        `;
        const result = await db.query(query, [ville, prix_standard, prix_premium]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};