const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth');
const Notification = require('../models/Notification');

// الـ endpoint اللي كتجيبو فـ React للتنبيهات
router.get('/admin-alerts', auth, async (req, res) => {
    try {
        const authorities = req.user.authorities || [];
        const roles = req.user.roles || [];
        const userId = req.user.userId || req.user.sub;

        console.log("🔐 User authorities:", authorities);
        console.log("🔐 User ID:", userId);

        let filter = {};

        if (Array.isArray(authorities) && authorities.includes('ROLE_ADMIN') ||
            Array.isArray(roles) && roles.includes('ROLE_ADMIN')) {
            // ✅ تصفية: فقط PENDING
            filter = { type: 'NEW_SIGNUP_REQUEST', status: 'PENDING' };
            console.log("👑 Admin: seeing only NEW_SIGNUP_REQUEST PENDING notifications");
        }
        else if (Array.isArray(authorities) && authorities.includes('ROLE_DISPATCHER') ||
            Array.isArray(roles) && roles.includes('ROLE_DISPATCHER')) {
            filter = { type: 'PARCEL_UPDATE', role: 'DISPATCHER' };
            console.log("📋 Dispatcher: seeing only PARCEL_UPDATE notifications");
        }
        else if (Array.isArray(authorities) && authorities.includes('ROLE_LIVREUR') ||
            Array.isArray(roles) && roles.includes('ROLE_LIVREUR')) {
            const numericUserId = parseInt(userId);
            filter = { type: 'PARCEL_UPDATE', role: 'LIVREUR', userId: numericUserId };
            console.log(`🚚 Livreur: seeing notifications for userId: ${numericUserId}`);
        }
        else {
            filter = { _id: null };
            console.log("👤 Client: seeing no notifications");
        }

        const alerts = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`📊 Found ${alerts.length} notifications for authorities: ${authorities}`);
        console.log("📊 Filter used:", JSON.stringify(filter));

        res.json(alerts);
    } catch (err) {
        console.error("Error fetching admin alerts:", err);
        res.status(500).json({ error: err.message });
    }
});

// جيب الطلبات اللي مازال ما تفعلاتش (PENDING) - خاص ب ADMIN
router.get('/pending-signups', auth, async (req, res) => {
    try {
        // تأكد أن المستخدم Admin
        const authorities = req.user.authorities || req.user.roles || "";

        if (!authorities.includes('ROLE_ADMIN')) {
            return res.status(403).json({ message: "Accès réservé aux administrateurs" });
        }

        const pending = await Notification.find({
            type: 'NEW_SIGNUP_REQUEST',
            status: 'PENDING'
        }).sort({ createdAt: -1 });

        res.json(pending);
    } catch (err) {
        console.error("Error fetching pending signups:", err);
        res.status(500).json({ error: err.message });
    }
});

// تحديث حالة notification
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );
        res.json(notification);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// حذف notification
router.delete('/:id', auth, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: "Notification supprimée" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// إرسال إشعار يدوي
router.post('/send-manual', auth, notificationController.sendManualNotification);

module.exports = router;