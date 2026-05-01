// src/controllers/deliveryController.js
const { assignLivreur } = require('../services/deliveryService');

const assignDelivery = async (req, res) => {
    try {
        const { trackingNumber } = req.params; // تأكدي من هادي
        const { livreurId } = req.body;
        const delivery = await assignLivreur(trackingNumber, livreurId);
        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { assignDelivery };