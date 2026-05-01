const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendNotification = async (to, subject, text, source = 'KAFKA', senderName = 'SYSTEM') => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text
        });

        // 🔥 تحديث حالة الـ notification لـ SENT
        const notification = await Notification.findOne({ recipient: to, type: 'NEW_SIGNUP_REQUEST' })
            .sort({ createdAt: -1 });

        if (notification) {
            notification.status = 'SENT';
            await notification.save();
            console.log(`✅ Notification mise à jour (SENT) pour: ${to}`);
        } else {
            // إذا ما لقيناهاش، نضيفو جديدة
            const newLog = new Notification({
                recipient: to,
                subject: subject,
                content: text,
                status: 'SENT',
                source: source,
                type: 'ACCOUNT_ACTIVATED',
                sentBy: senderName
            });
            await newLog.save();
        }

        console.log(`✅ Email envoyé à ${to} [Source: ${source}]`);

    } catch (error) {
        console.error("❌ Erreur d'envoi d'email:", error);

        // تسجيل الفشل
        const failLog = new Notification({
            recipient: to,
            subject: subject,
            content: text,
            status: 'FAILED',
            source: source,
            type: 'ACCOUNT_ACTIVATED',
            sentBy: senderName
        });
        await failLog.save();
    }
};