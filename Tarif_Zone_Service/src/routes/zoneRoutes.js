const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const verifyToken = require('../middlewares/auth');

/**
 * @swagger
 * /api/zones:
 *   get:
 *     summary: Get all zones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of zones
 */
router.get('/', zoneController.getAllZones);
/**
 * @swagger
 * /api/zones:
 *   post:
 *     summary: Create a zone
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             nom_zone: "Zone 1"
 *     responses:
 *       201:
 *         description: Zone created
 */
router.post('/', verifyToken, zoneController.createZone);

/**
 * @swagger
 * /api/zones/assign:
 *   post:
 *     summary: Assign ville to zone
 *     security:
 *       - bearerAuth: []
 */
router.post('/assign', verifyToken, zoneController.assignVille);

/**
 * @swagger
 * /api/zones/unassign:
 *   post:
 *     summary: Unassign ville from zone
 *     security:
 *       - bearerAuth: []
 */
router.post('/unassign', verifyToken, zoneController.unassignVille);

/**
 * @swagger
 * /api/zones/{id}:
 *   delete:
 *     summary: Delete zone
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', verifyToken, zoneController.deleteZone);

module.exports = router;