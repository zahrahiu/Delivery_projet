const tarifService = require('../services/tarifService');

exports.getTarifByVille = async (req, res) => {
    try {
        const data = await tarifService.getTarifByVille(req.params.ville);
        if (!data) return res.status(404).json({ message: "La ville n'est pas enregistrée" });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateTarif = async (req, res) => {
    try {
        const data = await tarifService.updateTarif(req.params.id, req.body);
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllTarifs = async (req, res) => {
    try {
        const data = await tarifService.getAllTarifs();
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ضرووووري تزيد هادي هنا باش الـ Router يلقاها
exports.deleteTarif = async (req, res) => {
    try {
        const deleted = await tarifService.deleteTarif(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Ville non trouvée" });
        res.json({ message: "Ville supprimée avec succès" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTarif = async (req, res) => {
    try {
        const data = await tarifService.createTarif(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};