const zoneService = require('../services/zoneService');

exports.getAllZones = async (req, res) => {
    try {
        const data = await zoneService.getAllZones();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.assignVille = async (req, res) => {
    const { zoneId, villeId } = req.body;
    try {
        const data = await zoneService.assignVilleToZone(zoneId, villeId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createZone = async (req, res) => {
    try {
        const data = await zoneService.createZone(req.body.nom_zone);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.unassignVille = async (req, res) => {
    const { villeId } = req.body;
    try {
        const data = await zoneService.unassignVilleFromZone(villeId);
        if (!data) {
            return res.status(404).json({ message: "Ville non trouvée" });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// controllers/zoneController.js

// ... بقية الدوال (getAllZones, createZone...)

exports.deleteZone = async (req, res) => {
    const { id } = req.params;
    console.log("Suppression de la zone ID:", id);
    try {
        const deleted = await zoneService.deleteZone(id);

        if (!deleted) {
            return res.status(404).json({ error: "Zone non trouvée" });
        }
        res.json({ message: "Zone supprimée avec succès" });
    } catch (err) {
        console.error("Erreur Backend Delete:", err.message);
        res.status(500).json({ error: err.message });
    }
};

