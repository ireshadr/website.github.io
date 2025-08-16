const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    cuisine: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        zone: { type: String, required: true }
    },
    contact: {
        phone: { type: String, required: true },
        email: { type: String, required: true },
        website: { type: String }
    },
    operatingHours: {
        monday: { open: String, close: String, closed: { type: Boolean, default: false } },
        tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
        wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
        thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
        friday: { open: String, close: String, closed: { type: Boolean, default: false } },
        saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
        sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
    },
    deliveryZones: [{
        type: String,
        required: true
    }],
    deliveryFee: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    minimumOrder: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    menu: [{
        category: { type: String, required: true },
        items: [{
            name: { type: String, required: true },
            description: { type: String },
            price: { type: Number, required: true, min: 0 },
            image: { type: String },
            available: { type: Boolean, default: true },
            spicy: { type: Boolean, default: false },
            vegetarian: { type: Boolean, default: false },
            vegan: { type: Boolean, default: false },
            allergens: [{ type: String }]
        }]
    }],
    rating: {
        average: { type: Number, min: 0, max: 5, default: 0 },
        count: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'temporarily_closed'],
        default: 'active'
    },
    featured: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    socialMedia: {
        facebook: { type: String },
        instagram: { type: String },
        whatsapp: { type: String }
    }
}, {
    timestamps: true
});

// Indexes for better performance
restaurantSchema.index({ name: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ 'deliveryZones': 1 });
restaurantSchema.index({ status: 1 });
restaurantSchema.index({ featured: -1 });
restaurantSchema.index({ 'rating.average': -1 });

// Check if restaurant is currently open
restaurantSchema.methods.isOpen = function () {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todayHours = this.operatingHours[day];
    if (todayHours.closed) return false;

    return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Check if restaurant delivers to a zone
restaurantSchema.methods.deliversTo = function (zone) {
    return this.deliveryZones.includes(zone);
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
