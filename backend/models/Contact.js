const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['general', 'complaint', 'suggestion', 'partnership', 'technical'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'closed'],
        default: 'new'
    },
    assignedTo: {
        type: String,
        trim: true
    },
    response: {
        message: { type: String, trim: true },
        respondedBy: { type: String, trim: true },
        respondedAt: { type: Date }
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for better performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ type: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
