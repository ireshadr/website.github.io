const express = require('express');
const Joi = require('joi');
const Contact = require('../models/Contact');
const { sendContactConfirmationEmail, notifyAdminNewContact } = require('../utils/emailService');
const router = express.Router();

// Validation schema for contact form
const contactValidationSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\+]?[\d\s\-\(\)]{8,15}$/).optional(),
    subject: Joi.string().min(5).max(200).required(),
    message: Joi.string().min(10).max(2000).required(),
    type: Joi.string().valid('general', 'complaint', 'suggestion', 'partnership', 'technical').optional()
});

// Submit contact form
router.post('/', async (req, res) => {
    try {
        // Validate request data
        const { error, value } = contactValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: error.details.map(detail => detail.message)
            });
        }

        // Create contact entry
        const contactData = {
            ...value,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            type: value.type || 'general'
        };

        const contact = new Contact(contactData);
        await contact.save();

        // Send confirmation email to customer
        try {
            await sendContactConfirmationEmail(contact);
        } catch (emailError) {
            console.error('Customer email sending failed:', emailError);
        }

        // Notify admin of new contact
        try {
            await notifyAdminNewContact(contact);
        } catch (emailError) {
            console.error('Admin notification email sending failed:', emailError);
        }

        // Emit real-time update to admin dashboard
        const io = req.app.get('io');
        io.emit('new_contact', {
            contactId: contact._id,
            name: contact.name,
            email: contact.email,
            subject: contact.subject,
            type: contact.type,
            priority: contact.priority,
            createdAt: contact.createdAt
        });

        res.status(201).json({
            success: true,
            message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
            data: {
                contactId: contact._id,
                submittedAt: contact.createdAt
            }
        });

    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.'
        });
    }
});

// Get contact by ID (for admin purposes)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(id);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            });
        }

        res.json({
            success: true,
            data: contact
        });

    } catch (error) {
        console.error('Contact fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du message'
        });
    }
});

// Update contact status (for admin purposes)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedTo } = req.body;

        const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide'
            });
        }

        const contact = await Contact.findById(id);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            });
        }

        // Update contact
        contact.status = status;
        if (assignedTo) {
            contact.assignedTo = assignedTo;
        }

        await contact.save();

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('contact_status_update', {
            contactId: contact._id,
            status: status,
            assignedTo: assignedTo,
            updatedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            data: {
                contactId: contact._id,
                status: contact.status,
                assignedTo: contact.assignedTo
            }
        });

    } catch (error) {
        console.error('Contact status update error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut'
        });
    }
});

// Add response to contact (for admin purposes)
router.post('/:id/respond', async (req, res) => {
    try {
        const { id } = req.params;
        const { message, respondedBy } = req.body;

        if (!message || !respondedBy) {
            return res.status(400).json({
                success: false,
                message: 'Message et nom du répondant requis'
            });
        }

        const contact = await Contact.findById(id);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            });
        }

        // Add response
        contact.response = {
            message: message,
            respondedBy: respondedBy,
            respondedAt: new Date()
        };
        contact.status = 'resolved';

        await contact.save();

        // Send response email to customer
        try {
            await sendContactResponseEmail(contact);
        } catch (emailError) {
            console.error('Response email sending failed:', emailError);
        }

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('contact_responded', {
            contactId: contact._id,
            respondedBy: respondedBy,
            respondedAt: contact.response.respondedAt
        });

        res.json({
            success: true,
            message: 'Réponse envoyée avec succès',
            data: {
                contactId: contact._id,
                response: contact.response
            }
        });

    } catch (error) {
        console.error('Contact response error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi de la réponse'
        });
    }
});

// Get contact statistics (for admin dashboard)
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                    closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
                }
            }
        ]);

        const typeStats = await Contact.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                summary: stats[0] || {
                    total: 0,
                    new: 0,
                    inProgress: 0,
                    resolved: 0,
                    closed: 0
                },
                byType: typeStats
            }
        });

    } catch (error) {
        console.error('Contact stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

module.exports = router;
