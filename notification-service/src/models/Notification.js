const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['SENT', 'FAILED'], default: 'SENT' },
    source: { type: String, enum: ['KAFKA', 'MANUAL'], default: 'KAFKA' },
    sentBy: { type: String, default: 'SYSTEM' }, // كيحط الاسم ديال Admin أو SYSTEM
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);