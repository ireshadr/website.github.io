const express = require('express');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Contact = require('../models/Contact');
const router = express.Router();

// Note: In a production environment, you would add authentication middleware here
// const authMiddleware = require('../middleware/auth');
// router.use(authMiddleware);

// Dashboard overview statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get orders statistics
        const [
            totalOrders,
            todayOrders,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
            todayRevenue,
            totalRevenue
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'delivering'] } }),
            Order.countDocuments({ orderStatus: 'delivered' }),
            Order.countDocuments({ orderStatus: 'cancelled' }),
            Order.aggregate([
                { $match: { createdAt: { $gte: today, $lt: tomorrow }, orderStatus: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ]),
            Order.aggregate([
                { $match: { orderStatus: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ])
        ]);

        // Get restaurant statistics
        const [
            totalRestaurants,
            activeRestaurants,
            featuredRestaurants
        ] = await Promise.all([
            Restaurant.countDocuments(),
            Restaurant.countDocuments({ status: 'active' }),
            Restaurant.countDocuments({ featured: true })
        ]);

        // Get contact statistics
        const [
            totalContacts,
            newContacts,
            pendingContacts
        ] = await Promise.all([
            Contact.countDocuments(),
            Contact.countDocuments({ status: 'new' }),
            Contact.countDocuments({ status: { $in: ['new', 'in_progress'] } })
        ]);

        // Recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('orderNumber customer.name restaurant.name finalAmount orderStatus createdAt');

        res.json({
            success: true,
            data: {
                orders: {
                    total: totalOrders,
                    today: todayOrders,
                    pending: pendingOrders,
                    delivered: deliveredOrders,
                    cancelled: cancelledOrders
                },
                revenue: {
                    today: todayRevenue[0]?.total || 0,
                    total: totalRevenue[0]?.total || 0
                },
                restaurants: {
                    total: totalRestaurants,
                    active: activeRestaurants,
                    featured: featuredRestaurants
                },
                contacts: {
                    total: totalContacts,
                    new: newContacts,
                    pending: pendingContacts
                },
                recentOrders: recentOrders
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

// Get all orders with filtering and pagination
router.get('/orders', async (req, res) => {
    try {
        const {
            status,
            restaurant,
            customer,
            date,
            limit = 20,
            page = 1,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};

        if (status) {
            query.orderStatus = status;
        }

        if (restaurant) {
            query['restaurant.name'] = new RegExp(restaurant, 'i');
        }

        if (customer) {
            query.$or = [
                { 'customer.name': new RegExp(customer, 'i') },
                { 'customer.email': new RegExp(customer, 'i') },
                { 'customer.phone': new RegExp(customer, 'i') }
            ];
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const orders = await Order.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalResults: total,
                    hasNextPage: skip + orders.length < total,
                    hasPreviousPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Admin orders fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des commandes'
        });
    }
});

// Get all contacts with filtering and pagination
router.get('/contacts', async (req, res) => {
    try {
        const {
            status,
            type,
            priority,
            limit = 20,
            page = 1,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};

        if (status) {
            query.status = status;
        }

        if (type) {
            query.type = type;
        }

        if (priority) {
            query.priority = priority;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const contacts = await Contact.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(query);

        res.json({
            success: true,
            data: {
                contacts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalResults: total,
                    hasNextPage: skip + contacts.length < total,
                    hasPreviousPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Admin contacts fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des contacts'
        });
    }
});

// Get all restaurants for admin management
router.get('/restaurants', async (req, res) => {
    try {
        const {
            status,
            cuisine,
            featured,
            limit = 20,
            page = 1,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        let query = {};

        if (status) {
            query.status = status;
        }

        if (cuisine) {
            query.cuisine = new RegExp(cuisine, 'i');
        }

        if (featured) {
            query.featured = featured === 'true';
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const restaurants = await Restaurant.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Restaurant.countDocuments(query);

        res.json({
            success: true,
            data: {
                restaurants,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalResults: total,
                    hasNextPage: skip + restaurants.length < total,
                    hasPreviousPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Admin restaurants fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des restaurants'
        });
    }
});

// Revenue analytics
router.get('/analytics/revenue', async (req, res) => {
    try {
        const { period = '7days' } = req.query;

        let days = 7;
        if (period === '30days') days = 30;
        if (period === '90days') days = 90;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Daily revenue for the period
        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    orderStatus: 'delivered'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$finalAmount' },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Revenue by restaurant
        const restaurantRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    orderStatus: 'delivered'
                }
            },
            {
                $group: {
                    _id: '$restaurant.name',
                    revenue: { $sum: '$finalAmount' },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { revenue: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            success: true,
            data: {
                period: period,
                dailyRevenue: dailyRevenue,
                topRestaurants: restaurantRevenue
            }
        });

    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des analyses de revenus'
        });
    }
});

// Orders analytics
router.get('/analytics/orders', async (req, res) => {
    try {
        const { period = '7days' } = req.query;

        let days = 7;
        if (period === '30days') days = 30;
        if (period === '90days') days = 90;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Orders by status
        const ordersByStatus = await Order.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Orders by hour of day
        const ordersByHour = await Order.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);

        // Average order value
        const avgOrderValue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    orderStatus: 'delivered'
                }
            },
            {
                $group: {
                    _id: null,
                    avgValue: { $avg: '$finalAmount' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                period: period,
                ordersByStatus: ordersByStatus,
                ordersByHour: ordersByHour,
                averageOrderValue: avgOrderValue[0]?.avgValue || 0,
                totalOrders: avgOrderValue[0]?.totalOrders || 0
            }
        });

    } catch (error) {
        console.error('Orders analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des analyses de commandes'
        });
    }
});

module.exports = router;
