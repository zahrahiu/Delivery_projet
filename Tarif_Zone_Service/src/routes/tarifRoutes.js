const express = require('express');
const router = express.Router();
const tarifController = require('../controllers/tarifController');
const verifyToken = require('../middlewares/auth'); // استيراد العساس

// مسموح للجميع يشوفو الأثمنة
router.get('/:ville', tarifController.getTarifByVille);

// مسموح فقط لـ Admin/Dispatcher يغيرو الأثمنة (زدنا verifyToken)
router.post('/', verifyToken, tarifController.upsertTarif);

module.exports = router;