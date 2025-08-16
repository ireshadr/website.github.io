const express = require('express');
const Joi = require('joi');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const router = express.Router();

// Validation schema for order creation
const orderValidationSchema = Joi.object({
    customer: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^[\+]?[\d\s\-\(\)]{8,15}$/).required(),
        address: Joi.object({
            street: Joi.string().min(5).max(200).required(),
            city: Joi.string().min(2).max(50).required(),
            postalCode: Joi.string().min(5).max(10).required(),
            zone: Joi.string().min(2).max(50).required()
        }).required()
    }).required(),
    restaurant: Joi.object({
        id: Joi.string().hex().length(24).required(),
        name: Joi.string().min(2).max(100).required()
    }).required(),
    items: Joi.array().items(
        Joi.object({
            name: Joi.string().min(2).max(100).required(),
            price: Joi.number().min(0).required(),
            quantity: Joi.number().integer().min(1).required(),
            specialInstructions: Joi.string().max(500).optional()
        })
    ).min(1).required(),
    totalAmount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('cash', 'card', 'mobile_money', 'bank_transfer').required(),
    specialInstructions: Joi.string().max(1000).optional()
});

// Create new order
router.post('/', async (req, res) => {
    try {
        // Validate request data
        const { error, value } = orderValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: error.details.map(detail => detail.message)
            });
        }

        // Check if restaurant exists and is active
        const restaurant = await Restaurant.findById(value.restaurant.id);
        if (!restaurant || restaurant.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Restaurant non disponible'
            });
        }

        // Check if restaurant delivers to the customer's zone
        if (!restaurant.deliversTo(value.customer.address.zone)) {
            return res.status(400).json({
                success: false,
                message: 'Livraison non disponible dans votre zone'
            });
        }

        // Check if order meets minimum order requirement
        if (value.totalAmount < restaurant.minimumOrder) {
            return res.status(400).json({
                success: false,
                message: `Commande minimum de ${restaurant.minimumOrder}€ requise`
            });
        }

        // Create new order
        const orderData = {
            ...value,
            deliveryFee: restaurant.deliveryFee,
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
        };

        const order = new Order(orderData);
        await order.save();

        // Send order confirmation email
        try {
            await sendOrderConfirmationEmail(order);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the order creation if email fails
        }

        // Emit real-time update to connected clients
        const io = req.app.get('io');
        io.emit('new_order', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            restaurant: order.restaurant.name,
            customer: order.customer.name,
            totalAmount: order.finalAmount
        });

        res.status(201).json({
            success: true,
            message: 'Commande créée avec succès',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                estimatedDeliveryTime: order.estimatedDeliveryTime,
                finalAmount: order.finalAmount
            }
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la commande'
        });
    }
});

// Get order by ID or order number
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        // Try to find by order number first, then by ID
        let order = await Order.findOne({ orderNumber: identifier });
        if (!order) {
            order = await Order.findById(identifier);
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Order fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la commande'
        });
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide'
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        // Update order status
        order.orderStatus = status;

        // Add timeline entry
        order.timeline.push({
            status: status,
            timestamp: new Date(),
            note: note || ''
        });

        // Set delivery time if delivered
        if (status === 'delivered') {
            order.actualDeliveryTime = new Date();
        }

        await order.save();

        // Emit real-time update
        const io = req.app.get('io');
        io.to(`order_${order._id}`).emit('order_status_update', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: status,
            timestamp: new Date(),
            note: note
        });

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.orderStatus,
                timeline: order.timeline
            }
        });

    } catch (error) {
        console.error('Order status update error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut'
        });
    }
});

// Get orders for a customer (by email or phone)
router.get('/customer/:contact', async (req, res) => {
    try {
        const { contact } = req.params;

        // Find orders by email or phone
        const orders = await Order.find({
            $or: [
                { 'customer.email': contact },
                { 'customer.phone': contact }
            ]
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error('Customer orders fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des commandes'
        });
    }
});

// Add rating to completed order
router.post('/:id/rating', async (req, res) => {
    try {
        const { id } = req.params;
        const { score, comment } = req.body;

        if (!score || score < 1 || score > 5) {
            return res.status(400).json({
                success: false,
                message: 'Note invalide (1-5 requis)'
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        if (order.orderStatus !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Seules les commandes livrées peuvent être notées'
            });
        }

        if (order.rating && order.rating.score) {
            return res.status(400).json({
                success: false,
                message: 'Cette commande a déjà été notée'
            });
        }

        // Add rating to order
        order.rating = {
            score: score,
            comment: comment || '',
            createdAt: new Date()
        };

        await order.save();

        // Update restaurant's average rating
        const restaurant = await Restaurant.findById(order.restaurant.id);
        if (restaurant) {
            const totalRatings = restaurant.rating.count;
            const currentAverage = restaurant.rating.average;
            const newAverage = ((currentAverage * totalRatings) + score) / (totalRatings + 1);

            restaurant.rating.average = Math.round(newAverage * 10) / 10; // Round to 1 decimal
            restaurant.rating.count = totalRatings + 1;

            await restaurant.save();
        }

        res.json({
            success: true,
            message: 'Note ajoutée avec succès',
            data: {
                orderId: order._id,
                rating: order.rating
            }
        });

    } catch (error) {
        console.error('Rating add error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout de la note'
        });
    }
});

module.exports = router;
