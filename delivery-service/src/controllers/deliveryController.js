// src/controllers/deliveryController.js
const { assignLivreur } = require('../services/deliveryService');

const assignDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const { livreurId } = req.body;
        const delivery = await assignLivreur(id, livreurId);
        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { assignDelivery };