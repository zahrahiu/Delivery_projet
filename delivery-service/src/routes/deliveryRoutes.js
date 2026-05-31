const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const hasRole = require("../middlewares/hasRole");
const { assignDelivery, unassignDelivery } = require('../controllers/deliveryController');
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

/**
 * @swagger
 * /api/deliveries/{trackingNumber}/unassign:
 *   patch:
 *     summary: Remove livreur assignment from delivery
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Livreur unassigned successfully
 *       403:
 *         description: Unauthorized
 */
router.patch('/:trackingNumber/unassign',
    authMiddleware,
    hasRole('ROLE_DISPATCHER'),
    unassignDelivery  // 🔥 هنا
);

module.exports = router;