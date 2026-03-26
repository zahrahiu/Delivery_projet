const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

// إعداد الجيمايل
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendNotification = async (to, subject, text, source = 'KAFKA', senderName = 'SYSTEM') => {
    try {
        // 1. صيفط الإيميل
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text
        });

        // 2. سجل فـ MongoDB بلي SENT
        const newLog = new Notification({
            recipient: to,
            subject: subject,
            content: text,
            status: 'SENT',
            source: source,
            sentBy: senderName
        });
        await newLog.save();
        console.log(`✅ Email envoyé à ${to} [Source: ${source}]`);

    } catch (error) {
        // 3. سجل بلي FAILED إيلا وقع مشكل
        const failLog = new Notification({
            recipient: to,
            subject: subject,
            content: text,
            status: 'FAILED',
            source: source,
            sentBy: senderName
        });
        await failLog.save();
        console.error("❌ Erreur d'envoi d'email:", error);
    }
};