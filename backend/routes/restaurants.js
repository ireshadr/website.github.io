const express = require('express');
const Restaurant = require('../models/Restaurant');
const router = express.Router();

// Get all active restaurants
router.get('/', async (req, res) => {
    try {
        const { zone, cuisine, featured, search, limit = 20, page = 1 } = req.query;

        // Build query filters
        let query = { status: 'active' };

        if (zone) {
            query.deliveryZones = { $in: [zone] };
        }

        if (cuisine) {
            query.cuisine = new RegExp(cuisine, 'i');
        }

        if (featured === 'true') {
            query.featured = true;
        }

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query with pagination
        const restaurants = await Restaurant.find(query)
            .sort({ featured: -1, 'rating.average': -1, name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
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
        console.error('Restaurants fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des restaurants'
        });
    }
});

// Get restaurant by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant non trouvé'
            });
        }

        // Add current status (open/closed)
        const restaurantData = restaurant.toObject();
        restaurantData.isCurrentlyOpen = restaurant.isOpen();

        res.json({
            success: true,
            data: restaurantData
        });

    } catch (error) {
        console.error('Restaurant fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du restaurant'
        });
    }
});

// Get restaurant menu
router.get('/:id/menu', async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.query;

        const restaurant = await Restaurant.findById(id).select('menu name');
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant non trouvé'
            });
        }

        let menu = restaurant.menu;

        // Filter by category if specified
        if (category) {
            menu = menu.filter(cat =>
                cat.category.toLowerCase().includes(category.toLowerCase())
            );
        }

        // Filter out unavailable items
        menu = menu.map(category => ({
            ...category.toObject(),
            items: category.items.filter(item => item.available)
        })).filter(category => category.items.length > 0);

        res.json({
            success: true,
            data: {
                restaurantName: restaurant.name,
                menu: menu
            }
        });

    } catch (error) {
        console.error('Menu fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du menu'
        });
    }
});

// Get available delivery zones
router.get('/delivery/zones', async (req, res) => {
    try {
        const zones = await Restaurant.distinct('deliveryZones', { status: 'active' });

        res.json({
            success: true,
            data: zones.sort()
        });

    } catch (error) {
        console.error('Delivery zones fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des zones de livraison'
        });
    }
});

// Get available cuisines
router.get('/cuisines/list', async (req, res) => {
    try {
        const cuisines = await Restaurant.distinct('cuisine', { status: 'active' });

        res.json({
            success: true,
            data: cuisines.sort()
        });

    } catch (error) {
        console.error('Cuisines fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des cuisines'
        });
    }
});

// Search restaurants
router.post('/search', async (req, res) => {
    try {
        const { query, filters = {} } = req.body;

        let searchQuery = { status: 'active' };

        // Text search
        if (query) {
            searchQuery.$text = { $search: query };
        }

        // Apply filters
        if (filters.zone) {
            searchQuery.deliveryZones = { $in: [filters.zone] };
        }

        if (filters.cuisine) {
            searchQuery.cuisine = new RegExp(filters.cuisine, 'i');
        }

        if (filters.minRating) {
            searchQuery['rating.average'] = { $gte: parseFloat(filters.minRating) };
        }

        if (filters.maxDeliveryFee) {
            searchQuery.deliveryFee = { $lte: parseFloat(filters.maxDeliveryFee) };
        }

        if (filters.isOpen) {
            // This would require more complex logic to check current operating hours
            // For now, we'll just return all active restaurants
        }

        const restaurants = await Restaurant.find(searchQuery)
            .sort({
                ...(query ? { score: { $meta: 'textScore' } } : {}),
                featured: -1,
                'rating.average': -1
            })
            .limit(50);

        res.json({
            success: true,
            data: restaurants
        });

    } catch (error) {
        console.error('Restaurant search error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche de restaurants'
        });
    }
});

module.exports = router;
