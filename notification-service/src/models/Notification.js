const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['SENT', 'FAILED', 'PENDING'],
        default: 'SENT'
    },
    source: {
        type: String,
        enum: ['KAFKA', 'MANUAL'],
        default: 'KAFKA'
    },
    type: {
        type: String,
        enum: ['NEW_SIGNUP_REQUEST', 'ACCOUNT_ACTIVATED', 'PARCEL_CREATED', 'PARCEL_DELIVERED', 'PARCEL_UPDATE'],
        default: 'NEW_SIGNUP_REQUEST'
    },
    sentBy: {
        type: String,
        default: 'SYSTEM'
    },
    userId: {
        type: Number,
        default: null
    },
    role: {
        type: String,
        enum: ['CLIENT', 'LIVREUR', 'DISPATCHER', 'ADMIN'],
        default: 'CLIENT'
    },
    firstName: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);