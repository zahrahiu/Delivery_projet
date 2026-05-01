const express = require('express');
const router = express.Router();
const { assignDelivery } = require('../controllers/deliveryController');
const authMiddleware = require("../middlewares/auth");
const hasRole = require("../middlewares/hasRole");

/**
 * @swagger
 * /api/deliveries/{trackingNumber}/assign:
 *   post:
 *     summary: Assign delivery to livreur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             livreurId: 5
 *     responses:
 *       200:
 *         description: Delivery assigned
 *       403:
 *         description: Unauthorized
 */
router.post('/:trackingNumber/assign',
    authMiddleware,
    hasRole('ROLE_DISPATCHER'),
    assignDelivery
);

module.exports = router;