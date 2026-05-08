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

        console.log(`✅ Email envoyé à ${to} [Source: ${source}]`);

        // تسجيل النجاح فالداتابيز
        const newLog = new Notification({
            recipient: to,
            subject: subject,
            content: text,
            status: 'SENT',
            source: source,
            type: 'NEW_SIGNUP_REQUEST',
            sentBy: senderName
        });
        await newLog.save();
        console.log(`✅ Notification logged for: ${to}`);

    } catch (error) {
        console.error("❌ Erreur d'envoi d'email:", error);

        // تسجيل الفشل
        const failLog = new Notification({
            recipient: to,
            subject: subject,
            content: text,
            status: 'FAILED',
            source: source,
            type: 'NEW_SIGNUP_REQUEST',
            sentBy: senderName
        });
        await failLog.save();
    }
};

exports.sendSignupConfirmation = async (email, firstName) => {
    const subject = "✅ Confirmation d'inscription QribLik";
    const text = `Bonjour ${firstName},\n\nVotre demande d'inscription a bien été reçue.\n\nVotre compte est en attente de validation par notre équipe.\n\nVous recevrez un email dès que votre compte sera activé.\n\nCordialement,\nL'équipe QribLik`;

    return exports.sendNotification(email, subject, text, 'KAFKA', 'SYSTEM');
};