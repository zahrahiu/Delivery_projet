const emailService = require('../services/emailService');

exports.sendManualNotification = async (req, res) => {
    const { recipient, subject, content } = req.body;
    const userRoles = req.user.authorities || req.user.roles || "";

    try {
        if (userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_DISPATCHER')) {
            await emailService.sendNotification(
                recipient,
                subject,
                content,
                'MANUAL',
                req.user.sub
            );
            res.json({ message: "Notification envoyée avec succès" });
        } else {
            res.status(403).json({ message: "Pas de permission" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};