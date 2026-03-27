const express = require('express');
const router = express.Router();
const tarifController = require('../controllers/tarifController');
const verifyToken = require('../middlewares/auth');

router.post('/', verifyToken, tarifController.createTarif);
router.get('/', tarifController.getAllTarifs);
router.get('/:ville', tarifController.getTarifByVille);
router.put('/:id', verifyToken, tarifController.updateTarif);
router.delete('/:id', verifyToken, tarifController.deleteTarif);

module.exports = router;