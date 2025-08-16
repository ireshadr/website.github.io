// TiKaz Livré - Professional Order Management System

// Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api', // Change this to your deployed backend URL
    ENDPOINTS: {
        ORDERS: '/orders',
        RESTAURANTS: '/restaurants',
        CONTACT: '/contact',
        ORDER_STATUS: '/orders/{id}/status',
        RESTAURANT_MENU: '/restaurants/{id}/menu'
    }
};

// Order Management Class
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
    }

    async loadRestaurants() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESTAURANTS}`);
            const result = await response.json();

            if (result.success) {
                this.restaurants = result.data.restaurants;
                this.populateRestaurantSelect();
            }
        } catch (error) {
            console.error('Failed to load restaurants:', error);
            this.showNotification('Erreur lors du chargement des restaurants', 'error');
        }
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

        // Contact form handling (separate from orders)
        const contactForm = document.getElementById('general-contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmission(e));
        }
    }

    async handleOrderSubmission(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-order');
        const formStatus = document.getElementById('form-status');

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

            // Generate order confirmation
            const orderNumber = this.generateOrderNumber();
            this.showOrderConfirmation(orderNumber, orderData);

            // Reset form
            e.target.reset();
            this.currentOrder = { items: [], total: 0, customer: {}, restaurant: null, status: 'pending' };

        } catch (error) {
            console.error('Order submission error:', error);
            this.showErrorMessage(error.message);
        } finally {
            submitBtn.textContent = '🚀 Confirmer la Commande';
            submitBtn.disabled = false;
        }
    }

    processOrderData(formData) {
        return {
            orderNumber: this.generateOrderNumber(),
            timestamp: new Date().toISOString(),
            customer: {
                name: formData.get('customer_name'),
                phone: formData.get('customer_phone'),
                email: formData.get('customer_email'),
                address: formData.get('delivery_address')
            },
            restaurant: formData.get('restaurant'),
            orderDetails: formData.get('order_details'),
            paymentMethod: formData.get('payment_method'),
            specialInstructions: formData.get('special_instructions'),
            estimatedTotal: this.currentOrder.total,
            deliveryFee: this.getDeliveryFee(formData.get('restaurant')),
            estimatedDeliveryTime: this.getEstimatedDeliveryTime(formData.get('restaurant'))
        };
    }

    validateOrder(orderData) {
        const required = ['customer.name', 'customer.phone', 'customer.address', 'restaurant', 'orderDetails'];
        return required.every(field => {
            const value = field.includes('.') ?
                orderData[field.split('.')[0]][field.split('.')[1]] :
                orderData[field];
            return value && value.trim().length > 0;
        });
    }

    async sendToNetlify(formData) {
        // Netlify Forms automatically handles form submissions
        return fetch('/', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(formData).toString()
        });
    }

    async sendToEmailJS(orderData) {
        if (typeof emailjs !== 'undefined') {
            return emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
                to_name: 'TiKaz Livré Team',
                customer_name: orderData.customer.name,
                customer_phone: orderData.customer.phone,
                customer_email: orderData.customer.email,
                delivery_address: orderData.customer.address,
                restaurant: this.restaurants[orderData.restaurant]?.name || orderData.restaurant,
                order_details: orderData.orderDetails,
                payment_method: orderData.paymentMethod,
                special_instructions: orderData.specialInstructions,
                estimated_total: orderData.estimatedTotal,
                order_number: orderData.orderNumber,
                order_time: new Date(orderData.timestamp).toLocaleString('fr-FR')
            });
        }
    }

    async sendToWebhook(orderData) {
        // For integration with restaurant POS systems or inventory management
        const webhookUrl = 'YOUR_WEBHOOK_URL'; // Replace with actual webhook

        if (webhookUrl && webhookUrl !== 'YOUR_WEBHOOK_URL') {
            return fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
        }
    }

    calculateOrderTotal() {
        const orderText = document.getElementById('order').value;
        const restaurant = document.getElementById('restaurant').value;

        if (!restaurant || !this.restaurants[restaurant]) {
            return;
        }

        let total = 0;
        const menu = this.restaurants[restaurant].menu;

        // Simple parsing - in production, you'd want a more sophisticated parser
        Object.entries(menu).forEach(([key, item]) => {
            const regex = new RegExp(item.name.toLowerCase(), 'i');
            const matches = orderText.toLowerCase().match(regex);
            if (matches) {
                // Extract quantity if specified
                const quantityMatch = orderText.match(new RegExp(`(\\d+)\\s*${item.name}`, 'i'));
                const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
                total += item.price * quantity;
            }
        });

        const deliveryFee = this.restaurants[restaurant].deliveryFee;
        total += deliveryFee;

        this.currentOrder.total = total;
        this.updateOrderSummary(total);
    }

    updateOrderSummary(total) {
        const summaryElement = document.getElementById('order-summary');
        const totalElement = document.getElementById('total-amount');

        if (total > 0) {
            summaryElement.style.display = 'block';
            totalElement.textContent = `${total.toFixed(2)}€`;
        } else {
            summaryElement.style.display = 'none';
        }
    }

    updateRestaurantInfo() {
        const restaurantSelect = document.getElementById('restaurant');
        const selectedRestaurant = restaurantSelect.value;

        if (selectedRestaurant && this.restaurants[selectedRestaurant]) {
            const restaurant = this.restaurants[selectedRestaurant];
            this.showRestaurantInfo(restaurant);
        }
    }

    showRestaurantInfo(restaurant) {
        // Create or update restaurant info display
        let infoDiv = document.getElementById('restaurant-info');
        if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.id = 'restaurant-info';
            infoDiv.className = 'restaurant-info';
            document.getElementById('restaurant').parentNode.appendChild(infoDiv);
        }

        infoDiv.innerHTML = `
            <div class="restaurant-details">
                <p><i class="fas fa-clock"></i> Livraison estimée: ${restaurant.deliveryTime} min</p>
                <p><i class="fas fa-motorcycle"></i> Frais de livraison: ${restaurant.deliveryFee.toFixed(2)}€</p>
            </div>
        `;
    }

    generateOrderNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `TK${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
    }

    getDeliveryFee(restaurantId) {
        return this.restaurants[restaurantId]?.deliveryFee || 3.50;
    }

    getEstimatedDeliveryTime(restaurantId) {
        return this.restaurants[restaurantId]?.deliveryTime || 30;
    }

    showOrderConfirmation(orderNumber, orderData) {
        const confirmationHtml = `
            <div class="order-confirmation">
                <h3>✅ Commande Confirmée!</h3>
                <p><strong>Numéro de commande:</strong> ${orderNumber}</p>
                <p><strong>Restaurant:</strong> ${this.restaurants[orderData.restaurant]?.name}</p>
                <p><strong>Livraison estimée:</strong> ${orderData.estimatedDeliveryTime} minutes</p>
                <p><strong>Total:</strong> ${(orderData.estimatedTotal + orderData.deliveryFee).toFixed(2)}€</p>
                <p>📱 Vous recevrez un SMS de confirmation sous peu.</p>
                <p>🏍️ Un livreur vous contactera bientôt!</p>
            </div>
        `;

        this.showNotification(confirmationHtml, 'success', 10000);
    }

    showErrorMessage(message) {
        const errorHtml = `
            <div class="order-error">
                <h3>❌ Erreur</h3>
                <p>${message}</p>
                <p>Veuillez réessayer ou nous contacter directement.</p>
            </div>
        `;

        this.showNotification(errorHtml, 'error', 8000);
    }

    showNotification(html, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = html;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
            transform: translateX(450px);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(450px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    setupOrderTracking() {
        // Real-time order tracking would be implemented here
        // This could integrate with delivery partner APIs
    }

    setupNotifications() {
        // Push notification setup for order updates
        if ('Notification' in window && 'serviceWorker' in navigator) {
            this.requestNotificationPermission();
        }
    }

    requestNotificationPermission() {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notifications enabled for order updates');
            }
        });
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Order Management System
    const orderSystem = new OrderManagementSystem();

    // Mobile Navigation Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
});

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

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active navigation link highlighting
    window.addEventListener('scroll', function () {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${id}"]`);

            if (scrollPos >= top && scrollPos <= bottom) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    });

    // Navbar background change on scroll
    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = '#fff';
            navbar.style.backdropFilter = 'none';
        }
    });

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');

            // Basic validation
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            // Simulate form submission
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                showNotification('Thank you! Your message has been sent successfully.', 'success');
                this.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }

    // Scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .portfolio-item, .about-content, .contact-content');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Statistics counter animation
    const stats = document.querySelectorAll('.stat h4');
    const statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => {
        statsObserver.observe(stat);
    });
});

// Helper Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

function animateCounter(element) {
    const target = parseInt(element.textContent.replace(/\D/g, ''));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    const suffix = element.textContent.replace(/[0-9]/g, '');

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, 16);
}

// Parallax effect for hero section
window.addEventListener('scroll', function () {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Lazy loading for images (when you add real images)
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', lazyLoadImages);

// Theme toggle functionality (optional - for dark mode)
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'true') {
            document.body.classList.add('dark-mode');
        }
    }
}

// Call theme toggle init
document.addEventListener('DOMContentLoaded', initThemeToggle);

// Performance optimization: Debounce scroll events
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
