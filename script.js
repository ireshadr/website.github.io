// TiKaz Livré - Professional Order Management System with Backend Integration

// Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api', // Change this to your deployed backend URL
    FALLBACK_ENABLED: true, // Enable fallback to Netlify/EmailJS when API is unavailable
    DEMO_MODE: true, // Set to false when backend is ready
    ENDPOINTS: {
        ORDERS: '/orders',
        RESTAURANTS: '/restaurants',
        CONTACT: '/contact',
        ORDER_STATUS: '/orders/{id}/status',
        RESTAURANT_MENU: '/restaurants/{id}/menu'
    }
};

// Order Management Class with Backend Integration
class OrderManagementSystem {
    constructor() {
        this.currentOrder = {
            items: [],
            total: 0,
            customer: {},
            restaurant: null,
            status: 'pending'
        };
        this.restaurants = [];
        this.socket = null;
        this.initializeOrderSystem();
    }

    async initializeOrderSystem() {
        await this.loadRestaurants();
        this.setupFormHandling();
        this.setupOrderTracking();
        this.setupNotifications();
        this.setupRealTimeUpdates();
    } async loadRestaurants() {
        try {
            // If in demo mode, skip API call and use fallback data
            if (API_CONFIG.DEMO_MODE) {
                console.log('🎭 Running in DEMO MODE - Using sample restaurant data');
                this.loadFallbackRestaurants();
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESTAURANTS}?featured=true`);
            const result = await response.json();

            if (result.success) {
                this.restaurants = result.data.restaurants;
                this.populateRestaurantSelect();
            }
        } catch (error) {
            console.error('Failed to load restaurants:', error);
            // Fallback to static restaurant data
            this.loadFallbackRestaurants();
        }
    }

    loadFallbackRestaurants() {
        this.restaurants = [
            { _id: 'tantine-marie', name: 'Chez Tantine Marie', cuisine: 'Créole', deliveryFee: 3.50, minimumOrder: 15 },
            { _id: 'jardin-epices', name: 'Le Jardin des Épices', cuisine: 'Créole Moderne', deliveryFee: 4.00, minimumOrder: 18 },
            { _id: 'pirogue-bleue', name: 'La Pirogue Bleue', cuisine: 'Fruits de mer', deliveryFee: 4.50, minimumOrder: 20 }
        ];
        this.populateRestaurantSelect();
    }

    populateRestaurantSelect() {
        const restaurantSelect = document.getElementById('restaurant');
        if (restaurantSelect && this.restaurants.length > 0) {
            restaurantSelect.innerHTML = '<option value="">Sélectionnez un restaurant</option>';

            this.restaurants.forEach(restaurant => {
                const option = document.createElement('option');
                option.value = restaurant._id;
                option.textContent = `${restaurant.name} - ${restaurant.cuisine}`;
                option.dataset.deliveryFee = restaurant.deliveryFee;
                option.dataset.minimumOrder = restaurant.minimumOrder;
                restaurantSelect.appendChild(option);
            });
        }
    }

    setupFormHandling() {
        // Order form handling
        const orderForm = document.getElementById('contact-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => this.handleOrderSubmission(e));

            // Real-time order calculation
            const orderTextarea = document.getElementById('order');
            if (orderTextarea) {
                orderTextarea.addEventListener('input', () => this.calculateOrderTotal());
            }

            // Restaurant selection change
            const restaurantSelect = document.getElementById('restaurant');
            if (restaurantSelect) {
                restaurantSelect.addEventListener('change', () => this.updateRestaurantInfo());
            }
        }
    }

    async handleOrderSubmission(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-order') || e.target.querySelector('button[type="submit"]');

        // Show loading state
        submitBtn.textContent = '🚀 Envoi en cours...';
        submitBtn.disabled = true;

        try {
            // Collect and process form data
            const formData = new FormData(e.target);
            const orderData = this.processOrderData(formData);

            // Validate order
            if (!this.validateOrder(orderData)) {
                throw new Error('Commande invalide. Veuillez vérifier vos informations.');
            }

            // Send order to backend API
            const result = await this.submitOrderToAPI(orderData);

            // Show success message with order details
            this.showOrderSuccess(result);

            // Reset form
            e.target.reset();
            this.resetOrderCalculator();

        } catch (error) {
            console.error('Order submission error:', error);
            this.showNotification(error.message || 'Erreur lors de l\'envoi de la commande', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = '🍽️ Passer Commande';
            submitBtn.disabled = false;
        }
    } async submitOrderToAPI(orderData) {
        try {
            // If in demo mode, simulate successful order
            if (API_CONFIG.DEMO_MODE) {
                console.log('🎭 DEMO MODE: Simulating order submission');
                console.log('Order data:', orderData);

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Return simulated success response
                return {
                    orderNumber: 'DEMO-' + Date.now(),
                    orderId: 'demo-order-' + Date.now(),
                    estimatedDeliveryTime: new Date(Date.now() + 45 * 60000),
                    finalAmount: orderData.totalAmount + orderData.deliveryFee
                };
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur du serveur');
            }

            if (!result.success) {
                throw new Error(result.message || 'Erreur lors du traitement de la commande');
            }

            return result.data;

        } catch (error) {
            if (API_CONFIG.FALLBACK_ENABLED && (error.name === 'TypeError' || error.message.includes('fetch'))) {
                // Network error - fallback to alternative methods
                console.warn('API unavailable, using fallback methods');
                await this.submitOrderFallback(orderData);
                return { orderNumber: 'OFFLINE-' + Date.now(), estimatedDeliveryTime: new Date(Date.now() + 45 * 60000) };
            }
            throw error;
        }
    }

    // Fallback methods for when API is unavailable
    async submitOrderFallback(orderData) {
        const promises = [];

        // Try Netlify Forms
        try {
            const formData = new FormData();
            formData.append('form-name', 'order');
            Object.keys(orderData).forEach(key => {
                if (typeof orderData[key] === 'object') {
                    formData.append(key, JSON.stringify(orderData[key]));
                } else {
                    formData.append(key, orderData[key]);
                }
            });

            promises.push(fetch('/', {
                method: 'POST',
                body: formData
            }));
        } catch (error) {
            console.warn('Netlify fallback failed:', error);
        }

        // Try EmailJS if configured
        if (window.emailjs) {
            try {
                promises.push(emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
                    customer_name: orderData.customer.name,
                    customer_email: orderData.customer.email,
                    customer_phone: orderData.customer.phone,
                    delivery_address: orderData.customer.address.street,
                    restaurant_name: orderData.restaurant.name,
                    order_details: JSON.stringify(orderData.items),
                    total_amount: orderData.finalAmount,
                    payment_method: orderData.paymentMethod,
                    special_instructions: orderData.specialInstructions
                }));
            } catch (error) {
                console.warn('EmailJS fallback failed:', error);
            }
        }

        await Promise.allSettled(promises);
    }

    processOrderData(formData) {
        const selectedRestaurant = this.restaurants.find(r => r._id === formData.get('restaurant'));

        // Parse order items from textarea
        const orderText = formData.get('order') || '';
        const items = this.parseOrderItems(orderText);

        // Calculate totals
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = selectedRestaurant ? selectedRestaurant.deliveryFee : 3.50;

        return {
            customer: {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: {
                    street: formData.get('address'),
                    city: 'La Réunion', // Default for now
                    postalCode: '97400', // Default for now
                    zone: this.extractZoneFromAddress(formData.get('address'))
                }
            },
            restaurant: {
                id: selectedRestaurant ? selectedRestaurant._id : '',
                name: selectedRestaurant ? selectedRestaurant.name : formData.get('restaurant')
            },
            items: items,
            totalAmount: totalAmount,
            deliveryFee: deliveryFee,
            paymentMethod: formData.get('payment') || 'cash',
            specialInstructions: formData.get('special-instructions') || ''
        };
    }

    parseOrderItems(orderText) {
        const items = [];
        const lines = orderText.split('\n').filter(line => line.trim());

        lines.forEach(line => {
            const match = line.match(/(\d+)x?\s*(.+?)(?:\s*-?\s*(\d+(?:\.\d{2})?)\s*€?)?/i);
            if (match) {
                const quantity = parseInt(match[1]) || 1;
                const name = match[2].trim();
                const price = parseFloat(match[3]) || 12.00; // Default price

                items.push({
                    name: name,
                    price: price,
                    quantity: quantity
                });
            }
        });

        return items.length > 0 ? items : [{ name: orderText, price: 12.00, quantity: 1 }];
    }

    extractZoneFromAddress(address) {
        const zones = ['Nord', 'Sud', 'Est', 'Ouest', 'Cirques'];
        const addressLower = address.toLowerCase();

        for (const zone of zones) {
            if (addressLower.includes(zone.toLowerCase())) {
                return zone;
            }
        }

        // Extract from common city names
        if (addressLower.includes('saint-denis')) return 'Nord';
        if (addressLower.includes('saint-pierre')) return 'Sud';
        if (addressLower.includes('saint-paul')) return 'Ouest';
        if (addressLower.includes('saint-andré')) return 'Est';

        return 'Nord'; // Default zone
    }

    validateOrder(orderData) {
        if (!orderData.customer.name || orderData.customer.name.length < 2) {
            this.showNotification('Nom requis (minimum 2 caractères)', 'error');
            return false;
        }

        if (!orderData.customer.email || !this.isValidEmail(orderData.customer.email)) {
            this.showNotification('Email valide requis', 'error');
            return false;
        }

        if (!orderData.customer.phone || orderData.customer.phone.length < 8) {
            this.showNotification('Numéro de téléphone valide requis', 'error');
            return false;
        }

        if (!orderData.customer.address.street || orderData.customer.address.street.length < 5) {
            this.showNotification('Adresse de livraison complète requise', 'error');
            return false;
        }

        if (!orderData.restaurant.id) {
            this.showNotification('Veuillez sélectionner un restaurant', 'error');
            return false;
        }

        if (!orderData.items || orderData.items.length === 0) {
            this.showNotification('Veuillez préciser votre commande', 'error');
            return false;
        }

        // Check minimum order amount
        const selectedRestaurant = this.restaurants.find(r => r._id === orderData.restaurant.id);
        if (selectedRestaurant && orderData.totalAmount < selectedRestaurant.minimumOrder) {
            this.showNotification(`Commande minimum: ${selectedRestaurant.minimumOrder}€`, 'error');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    showOrderSuccess(orderData) {
        const message = `
            <div class="order-success">
                <h3>🎉 Commande confirmée!</h3>
                <p><strong>Numéro de commande:</strong> ${orderData.orderNumber}</p>
                <p><strong>Livraison estimée:</strong> ${new Date(orderData.estimatedDeliveryTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Total:</strong> ${orderData.finalAmount}€</p>
                <p>Vous recevrez un email de confirmation avec tous les détails.</p>
                <p>Vous pouvez suivre votre commande avec le numéro ci-dessus.</p>
            </div>
        `;
        this.showNotification(message, 'success', 8000);

        // Start order tracking if we have Socket.io
        if (orderData.orderId && this.socket) {
            this.socket.emit('join_order_room', orderData.orderId);
        }
    }

    calculateOrderTotal() {
        const orderTextarea = document.getElementById('order');
        const restaurantSelect = document.getElementById('restaurant');
        const orderSummaryElement = document.getElementById('order-summary');

        if (!orderTextarea || !restaurantSelect || !orderSummaryElement) return;

        const orderText = orderTextarea.value;
        const selectedRestaurantId = restaurantSelect.value;
        const selectedRestaurant = this.restaurants.find(r => r._id === selectedRestaurantId);

        if (!orderText.trim() || !selectedRestaurant) {
            orderSummaryElement.innerHTML = '';
            return;
        }

        const items = this.parseOrderItems(orderText);
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = selectedRestaurant.deliveryFee;
        const total = subtotal + deliveryFee;

        const summaryHTML = `
            <div class="order-summary-content">
                <h4>📋 Résumé de votre commande</h4>
                <div class="summary-items">
                    ${items.map(item => `
                        <div class="summary-item">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}€</span>
                        </div>
                    `).join('')}
                </div>
                <div class="summary-fees">
                    <div class="summary-item">
                        <span>Sous-total</span>
                        <span>${subtotal.toFixed(2)}€</span>
                    </div>
                    <div class="summary-item">
                        <span>Frais de livraison</span>
                        <span>${deliveryFee.toFixed(2)}€</span>
                    </div>
                    <div class="summary-item total">
                        <span><strong>Total</strong></span>
                        <span><strong>${total.toFixed(2)}€</strong></span>
                    </div>
                </div>
                ${subtotal < selectedRestaurant.minimumOrder ?
                `<div class="minimum-order-warning">
                        ⚠️ Commande minimum: ${selectedRestaurant.minimumOrder}€ 
                        (il manque ${(selectedRestaurant.minimumOrder - subtotal).toFixed(2)}€)
                    </div>` : ''
            }
            </div>
        `;

        orderSummaryElement.innerHTML = summaryHTML;
    }

    resetOrderCalculator() {
        const orderSummaryElement = document.getElementById('order-summary');
        if (orderSummaryElement) {
            orderSummaryElement.innerHTML = '';
        }
    }

    updateRestaurantInfo() {
        const restaurantSelect = document.getElementById('restaurant');
        const restaurantInfoElement = document.getElementById('restaurant-info');

        if (!restaurantSelect || !restaurantInfoElement) return;

        const selectedRestaurantId = restaurantSelect.value;
        const selectedRestaurant = this.restaurants.find(r => r._id === selectedRestaurantId);

        if (selectedRestaurant) {
            restaurantInfoElement.innerHTML = `
                <div class="restaurant-info-content">
                    <h4>📍 ${selectedRestaurant.name}</h4>
                    <p><strong>Cuisine:</strong> ${selectedRestaurant.cuisine}</p>
                    <p><strong>Frais de livraison:</strong> ${selectedRestaurant.deliveryFee}€</p>
                    <p><strong>Commande minimum:</strong> ${selectedRestaurant.minimumOrder}€</p>
                    ${selectedRestaurant.estimatedDeliveryTime ?
                    `<p><strong>Temps de livraison:</strong> ${selectedRestaurant.estimatedDeliveryTime} min</p>` : ''
                }
                </div>
            `;
        } else {
            restaurantInfoElement.innerHTML = '';
        }

        // Recalculate order total with new restaurant
        this.calculateOrderTotal();
    }

    setupOrderTracking() {
        // Order tracking functionality
        const trackingForm = document.getElementById('order-tracking-form');
        if (trackingForm) {
            trackingForm.addEventListener('submit', (e) => this.handleOrderTracking(e));
        }
    }

    async handleOrderTracking(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const orderNumber = formData.get('order-number');

        if (!orderNumber) {
            this.showNotification('Veuillez saisir un numéro de commande', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}/${orderNumber}`);
            const result = await response.json();

            if (result.success) {
                this.displayOrderStatus(result.data);
            } else {
                this.showNotification('Commande non trouvée', 'error');
            }
        } catch (error) {
            console.error('Order tracking error:', error);
            this.showNotification('Erreur lors de la recherche de commande', 'error');
        }
    }

    displayOrderStatus(order) {
        const statusContainer = document.getElementById('order-status-container');
        if (!statusContainer) return;

        const statusHTML = `
            <div class="order-status">
                <h3>📦 Commande ${order.orderNumber}</h3>
                <div class="status-info">
                    <p><strong>Restaurant:</strong> ${order.restaurant.name}</p>
                    <p><strong>Statut:</strong> ${this.getStatusText(order.orderStatus)}</p>
                    <p><strong>Total:</strong> ${order.finalAmount}€</p>
                    ${order.estimatedDeliveryTime ?
                `<p><strong>Livraison estimée:</strong> ${new Date(order.estimatedDeliveryTime).toLocaleString('fr-FR')}</p>` : ''
            }
                </div>
                <div class="status-timeline">
                    ${order.timeline ? order.timeline.map(entry => `
                        <div class="timeline-entry ${entry.status === order.orderStatus ? 'current' : ''}">
                            <span class="timeline-status">${this.getStatusText(entry.status)}</span>
                            <span class="timeline-time">${new Date(entry.timestamp).toLocaleString('fr-FR')}</span>
                            ${entry.note ? `<span class="timeline-note">${entry.note}</span>` : ''}
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        `;

        statusContainer.innerHTML = statusHTML;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '⏳ En attente',
            'confirmed': '✅ Confirmée',
            'preparing': '👨‍🍳 En préparation',
            'ready': '📦 Prête',
            'delivering': '🚗 En livraison',
            'delivered': '🎉 Livrée',
            'cancelled': '❌ Annulée'
        };
        return statusMap[status] || status;
    }

    setupRealTimeUpdates() {
        // Setup Socket.io for real-time order updates
        if (typeof io !== 'undefined') {
            try {
                this.socket = io(API_CONFIG.BASE_URL.replace('/api', ''));

                this.socket.on('order_status_update', (data) => {
                    this.handleOrderStatusUpdate(data);
                });

                this.socket.on('connect', () => {
                    console.log('Connected to real-time updates');
                });

                this.socket.on('disconnect', () => {
                    console.log('Disconnected from real-time updates');
                });

            } catch (error) {
                console.warn('Socket.io not available:', error);
            }
        }
    }

    handleOrderStatusUpdate(data) {
        // Show notification for order status updates
        this.showNotification(
            `Commande ${data.orderNumber}: ${this.getStatusText(data.status)}`,
            'info',
            5000
        );

        // Update the order status display if visible
        const orderStatusContainer = document.getElementById('order-status-container');
        if (orderStatusContainer && orderStatusContainer.innerHTML.includes(data.orderNumber)) {
            // Refresh the order status display
            this.handleOrderTracking(new Event('submit'));
        }
    }

    setupNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = message;

        container.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);

        // Allow manual close
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function () {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    navToggle.addEventListener('click', function () {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
});

// Initialize Order Management System
document.addEventListener('DOMContentLoaded', function () {
    window.orderSystem = new OrderManagementSystem();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function () {
    const animatedElements = document.querySelectorAll('.feature-card, .restaurant-card, .offer-card, .service-card');
    animatedElements.forEach(el => observer.observe(el));
});

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScroll = debounce(() => {
    // Scroll-dependent functions can be called here
}, 16);

window.addEventListener('scroll', debouncedScroll);
