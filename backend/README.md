# TiKaz Livré Backend API

🍽️ **Professional backend system for TiKaz Livré food delivery platform**

A robust Node.js/Express backend with MongoDB for handling orders, restaurant management, contact forms, and real-time updates for a Foodora-style food delivery service in La Réunion.

## 🚀 Features

### Core Functionality
- **Order Management**: Complete order lifecycle with real-time status updates
- **Restaurant Management**: Full restaurant profiles with menus and delivery zones
- **Contact System**: Professional contact form handling with admin notifications
- **Real-time Updates**: Socket.io integration for live order tracking
- **Email Notifications**: Automated emails for orders and contact confirmations
- **Admin Dashboard**: Comprehensive analytics and management tools

### Technical Features
- **RESTful API**: Clean, documented API endpoints
- **Data Validation**: Joi schema validation for all inputs
- **Rate Limiting**: Protection against abuse
- **CORS Support**: Secure cross-origin requests
- **Error Handling**: Comprehensive error management
- **Database Indexing**: Optimized MongoDB queries
- **Environment Configuration**: Secure configuration management

## 📋 Prerequisites

- **Node.js** (v16.0.0 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone and Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Configure Environment Variables
Edit the `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=https://your-username.github.io/website.github.io

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/tikaz-livre

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=TiKaz Livré <noreply@tikaz-livre.re>

# Admin Configuration
ADMIN_EMAIL=admin@tikaz-livre.re
ADMIN_PASSWORD=change-this-strong-password
```

### 3. Database Setup

#### Option A: Local MongoDB
```bash
# Start MongoDB service
mongod

# Seed the database with sample data
node scripts/seedDatabase.js
```

#### Option B: MongoDB Atlas (Recommended for Production)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 4. Email Setup (Gmail Example)
1. Enable 2FA on your Gmail account
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Orders
```
POST   /api/orders              # Create new order
GET    /api/orders/:id          # Get order by ID/number
PATCH  /api/orders/:id/status   # Update order status
GET    /api/orders/customer/:contact  # Get customer orders
POST   /api/orders/:id/rating   # Add order rating
```

### Restaurants
```
GET    /api/restaurants         # Get all restaurants (with filters)
GET    /api/restaurants/:id     # Get restaurant details
GET    /api/restaurants/:id/menu # Get restaurant menu
GET    /api/restaurants/delivery/zones # Get delivery zones
POST   /api/restaurants/search  # Search restaurants
```

### Contact
```
POST   /api/contact             # Submit contact form
GET    /api/contact/:id         # Get contact by ID (admin)
PATCH  /api/contact/:id/status  # Update contact status (admin)
POST   /api/contact/:id/respond # Respond to contact (admin)
```

### Admin Dashboard
```
GET    /api/admin/dashboard/stats     # Dashboard statistics
GET    /api/admin/orders              # All orders (admin)
GET    /api/admin/contacts            # All contacts (admin)
GET    /api/admin/restaurants         # All restaurants (admin)
GET    /api/admin/analytics/revenue   # Revenue analytics
GET    /api/admin/analytics/orders    # Order analytics
```

## 🔧 Frontend Integration

### Update your frontend script.js

Replace the webhook URLs in your existing `OrderManagementSystem` class:

```javascript
// In your script.js, update the API endpoints
const API_BASE_URL = 'https://your-backend-url.com/api';

// Example: Submit order
async submitOrder(orderData) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        if (result.success) {
            this.showNotification('Commande envoyée avec succès!', 'success');
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        this.showNotification('Erreur lors de l\'envoi: ' + error.message, 'error');
        throw error;
    }
}

// Example: Submit contact form
async submitContact(contactData) {
    try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData)
        });
        
        const result = await response.json();
        if (result.success) {
            this.showNotification('Message envoyé avec succès!', 'success');
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        this.showNotification('Erreur lors de l\'envoi: ' + error.message, 'error');
        throw error;
    }
}
```

## 🌐 Deployment Options

### Option 1: Azure App Service (Recommended)
```bash
# Install Azure CLI
npm install -g @azure/static-web-apps-cli

# Deploy to Azure
az webapp up --name tikaz-livre-api --resource-group myResourceGroup
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 3: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Create app and deploy
heroku create tikaz-livre-api
git push heroku main
```

### Option 4: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway deploy
```

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, random secret in production
3. **Database Access**: Restrict MongoDB access
4. **CORS**: Configure proper CORS origins
5. **Rate Limiting**: Adjust limits based on traffic
6. **HTTPS**: Always use HTTPS in production

## 📊 Monitoring & Analytics

### Built-in Analytics
- Order analytics (volume, revenue, timing)
- Restaurant performance metrics
- Contact form statistics
- Real-time dashboard

### Recommended External Tools
- **Application Monitoring**: Azure Application Insights
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot
- **Performance**: New Relic

## 🧪 Testing

### Run Tests
```bash
npm test
```

### API Testing with Postman
Import the provided Postman collection for complete API testing.

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB service is running
   - Verify connection string
   - Check network connectivity

2. **Email Not Sending**
   - Verify email credentials
   - Check Gmail App Password
   - Review SMTP settings

3. **CORS Errors**
   - Update `FRONTEND_URL` in `.env`
   - Check CORS configuration

4. **Rate Limiting Issues**
   - Adjust rate limits in server.js
   - Implement IP whitelisting

### Debug Mode
```bash
# Enable debug logging
DEBUG=tikaz-livre:* npm run dev
```

## 📚 Documentation

### API Documentation
- Swagger documentation available at `/api/docs` (when implemented)
- Postman collection provided
- OpenAPI specification included

### Database Schema
- MongoDB collections: `orders`, `restaurants`, `contacts`
- Indexes optimized for common queries
- Data validation at schema level

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: contact@tikaz-livre.re
- 💬 WhatsApp: +262 692 XX XX XX
- 🐛 Issues: GitHub Issues page

---

**TiKaz Livré** - Bringing authentic Réunion cuisine to your doorstep! 🇷🇪🍽️
