const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const verifyToken = require('../middlewares/auth');

// routes/zoneRoutes.js
router.get('/', verifyToken, zoneController.getAllZones);
router.post('/', verifyToken, zoneController.createZone);
router.post('/assign', verifyToken, zoneController.assignVille);
router.post('/unassign', verifyToken, zoneController.unassignVille);
router.delete('/:id', verifyToken, zoneController.deleteZone);
module.exports = router;