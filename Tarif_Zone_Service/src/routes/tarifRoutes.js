const express = require('express');
const router = express.Router();
const tarifController = require('../controllers/tarifController');
const verifyToken = require('../middlewares/auth');

router.get('/', tarifController.getAllTarifs);
// 🔥 Routes pour les coordonnées (placer AVANT la route /:ville)
router.get('/coordinates/all', verifyToken, tarifController.getAllCitiesCoordinates);
router.get('/coordinates/:city', verifyToken, tarifController.getCityCoordinates);

router.get('/:ville', tarifController.getTarifByVille);
router.post('/', verifyToken, tarifController.createTarif);
router.put('/:id', verifyToken, tarifController.updateTarif);
router.delete('/:id', verifyToken, tarifController.deleteTarif);
router.get('/parcel-price/:zoneId', tarifController.getTarifForParcel);
module.exports = router;