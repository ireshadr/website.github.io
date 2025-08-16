# 🚀 TiKaz Livré - Professional Backend Deployment Guide

## Overview

Your TiKaz Livré food delivery platform now has a complete professional backend system similar to Foodora! Here's what you have:

### ✅ What's Implemented

1. **Professional Node.js Backend API**
   - Order management with real-time tracking
   - Restaurant management with menus
   - Contact form handling with admin notifications
   - Email notifications (order confirmations, contact responses)
   - Real-time updates via Socket.io
   - Admin dashboard with analytics

2. **Updated Frontend Integration**
   - API calls to backend instead of just static forms
   - Fallback to Netlify/EmailJS when backend is unavailable
   - Real-time order tracking
   - Professional order validation and processing

3. **Database & Models**
   - MongoDB with optimized schemas
   - Order lifecycle management
   - Restaurant data with full menus
   - Contact management system

## 🛠️ Quick Setup Guide

### Step 1: Set Up the Backend

1. **Navigate to backend folder:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Edit .env file with your settings:**
   ```env
   # Server
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=https://your-username.github.io/website.github.io

   # Database (choose one)
   MONGODB_URI=mongodb://localhost:27017/tikaz-livre
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tikaz-livre

   # Email (Gmail example)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=TiKaz Livré <noreply@tikaz-livre.re>

   # Security
   JWT_SECRET=your-super-secret-key-change-this
   ```

4. **Start MongoDB (if using local):**
   ```bash
   # Windows
   mongod

   # macOS/Linux
   sudo systemctl start mongod
   ```

5. **Seed the database:**
   ```bash
   node scripts/seedDatabase.js
   ```

6. **Start the backend:**
   ```bash
   npm run dev
   ```

Your backend API will be running at `http://localhost:5000`

### Step 2: Update Frontend Configuration

1. **Update the API URL in script.js:**
   ```javascript
   const API_CONFIG = {
       BASE_URL: 'http://localhost:5000/api', // For local development
       // OR for production:
       // BASE_URL: 'https://your-backend-url.com/api',
   };
   ```

2. **Test the integration:**
   - Open your website
   - Try placing an order
   - Check the browser console for any errors

### Step 3: Deploy the Backend (Choose One)

#### Option A: Azure App Service (Recommended)
```bash
# Install Azure CLI
az login

# Create resource group
az group create --name tikaz-livre-rg --location "France Central"

# Create app service plan
az appservice plan create --name tikaz-livre-plan --resource-group tikaz-livre-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group tikaz-livre-rg --plan tikaz-livre-plan --name tikaz-livre-api --runtime "NODE|18-lts"

# Deploy from local Git
az webapp deployment source config-local-git --name tikaz-livre-api --resource-group tikaz-livre-rg

# Add MongoDB Atlas connection string
az webapp config appsettings set --resource-group tikaz-livre-rg --name tikaz-livre-api --settings MONGODB_URI="your-mongodb-atlas-connection-string"

# Deploy
git remote add azure https://tikaz-livre-api.scm.azurewebsites.net:443/tikaz-livre-api.git
git push azure main
```

#### Option B: Railway (Simple)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

#### Option C: Render (Free tier available)
1. Push your backend code to GitHub
2. Connect to Render.com
3. Create new Web Service
4. Connect your GitHub repo
5. Set environment variables
6. Deploy

### Step 4: Set Up Database (Production)

#### MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Create database user
4. Whitelist IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get connection string
6. Update `MONGODB_URI` in your deployment

### Step 5: Set Up Email Service

#### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security → App passwords
   - Generate password for "Mail"
3. Use generated password in `EMAIL_PASS`

#### Alternative: SendGrid
```env
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Step 6: Update Frontend for Production

1. **Update API_CONFIG.BASE_URL in script.js:**
   ```javascript
   const API_CONFIG = {
       BASE_URL: 'https://your-deployed-backend.com/api',
       // ...
   };
   ```

2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update backend integration"
   git push origin main
   ```

3. **GitHub Pages will automatically deploy**

## 🔧 Testing Your Setup

### Backend Health Check
Visit: `https://your-backend-url.com/api/health`
Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "TiKaz Livré Backend API",
  "version": "1.0.0"
}
```

### Order Flow Test
1. Visit your website
2. Fill out order form
3. Submit order
4. Check email for confirmation
5. Check backend logs for order creation

### Contact Form Test
1. Use contact form
2. Check email for confirmation
3. Admin should receive notification

## 📊 Admin Dashboard Access

Your backend includes admin endpoints for managing:
- Orders: `GET /api/admin/orders`
- Restaurants: `GET /api/admin/restaurants`
- Contacts: `GET /api/admin/contacts`
- Analytics: `GET /api/admin/analytics/revenue`

To create a simple admin interface, you can:
1. Use tools like Postman for API testing
2. Build a React/Vue admin dashboard
3. Use MongoDB Compass for direct database access

## 🔐 Security Considerations

### Production Checklist
- [ ] Change JWT_SECRET to a strong random string
- [ ] Use HTTPS for all connections
- [ ] Restrict CORS origins to your domain only
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB authentication
- [ ] Set up proper error logging
- [ ] Configure rate limiting appropriately

### Environment Variables for Production
```env
NODE_ENV=production
FRONTEND_URL=https://your-username.github.io/website.github.io
JWT_SECRET=super-long-random-string-at-least-64-characters-long
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tikaz-livre
EMAIL_USER=your-production-email@domain.com
EMAIL_PASS=your-app-password
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update `FRONTEND_URL` in backend .env
   - Check CORS configuration in server.js

2. **Database Connection Failed**
   - Verify MongoDB URI
   - Check network connectivity
   - Ensure database user has correct permissions

3. **Email Not Sending**
   - Verify email credentials
   - Check spam folder
   - Try different email service

4. **Orders Not Saving**
   - Check backend logs
   - Verify database connection
   - Test API endpoints with Postman

### Debug Commands
```bash
# Check backend logs
npm run dev

# Test API endpoints
curl http://localhost:5000/api/health

# Check database connection
node -e "require('mongoose').connect('your-mongodb-uri').then(() => console.log('Connected')).catch(console.error)"
```

## 📈 Next Steps & Advanced Features

### Immediate Improvements
1. **Add authentication for admin panel**
2. **Implement order notifications via SMS**
3. **Add payment gateway integration (Stripe)**
4. **Create mobile app with React Native**

### Advanced Features
1. **Real-time order tracking with GPS**
2. **Restaurant dashboard for order management**
3. **Customer loyalty program**
4. **Advanced analytics and reporting**
5. **Multi-language support**
6. **Order scheduling system**

### Scaling Considerations
1. **Redis for caching**
2. **Load balancer for multiple instances**
3. **CDN for static assets**
4. **Database indexing optimization**
5. **API rate limiting per user**

## 🆘 Support

If you need help:
1. Check the backend README.md for detailed documentation
2. Review the API endpoints in the routes files
3. Test with Postman collection (can be created)
4. Check database schemas in models folder

Your TiKaz Livré platform is now ready for professional food delivery operations! 🍽️🚀

---

**Happy coding!** 🇷🇪
