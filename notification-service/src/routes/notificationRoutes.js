const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

// هاد الـ Route محمي بـ JWT
router.post('/send-manual', auth, notificationController.sendManualNotification);

module.exports = router;