// src/controllers/deliveryController.js
const { assignLivreur, unassignLivreur } = require('../services/deliveryService'); // 🔥 زيدي unassignLivreur

const assignDelivery = async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const { livreurId } = req.body;
        const delivery = await assignLivreur(trackingNumber, livreurId);
        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unassignDelivery = async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const result = await unassignLivreur(trackingNumber);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { assignDelivery, unassignDelivery };