const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
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
            required: true,
            trim: true
        },
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            zone: { type: String, required: true }
        }
    },
    restaurant: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    items: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        specialInstructions: { type: String, trim: true }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    deliveryFee: {
        type: Number,
        required: true,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'card', 'mobile_money', 'bank_transfer']
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'],
        default: 'pending'
    },
    specialInstructions: {
        type: String,
        trim: true
    },
    estimatedDeliveryTime: {
        type: Date
    },
    actualDeliveryTime: {
        type: Date
    },
    deliveryPerson: {
        name: { type: String },
        phone: { type: String },
        vehicleType: { type: String }
    },
    timeline: [{
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
        },
        timestamp: { type: Date, default: Date.now },
        note: { type: String }
    }],
    rating: {
        score: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        createdAt: { type: Date }
    }
}, {
    timestamps: true
});

// Indexes for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `TKL${Date.now()}${String(count + 1).padStart(4, '0')}`;

        // Add initial timeline entry
        this.timeline.push({
            status: 'pending',
            timestamp: new Date(),
            note: 'Commande reçue'
        });
    }
    next();
});

// Calculate final amount before saving
orderSchema.pre('save', function (next) {
    this.finalAmount = this.totalAmount + this.deliveryFee;
    next();
});

module.exports = mongoose.model('Order', orderSchema);
