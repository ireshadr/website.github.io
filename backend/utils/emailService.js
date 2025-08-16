const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send order confirmation email to customer
const sendOrderConfirmationEmail = async (order) => {
    try {
        const transporter = createTransporter();

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .item { border-bottom: 1px solid #eee; padding: 10px 0; }
                .total { font-weight: bold; font-size: 18px; color: #ff6b35; }
                .footer { text-align: center; padding: 20px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍽️ TiKaz Livré</h1>
                    <h2>Confirmation de Commande</h2>
                </div>
                
                <div class="content">
                    <h3>Bonjour ${order.customer.name},</h3>
                    <p>Merci pour votre commande ! Voici les détails :</p>
                    
                    <div class="order-details">
                        <h4>📋 Commande #${order.orderNumber}</h4>
                        <p><strong>Restaurant:</strong> ${order.restaurant.name}</p>
                        <p><strong>Statut:</strong> ${getStatusText(order.orderStatus)}</p>
                        <p><strong>Livraison estimée:</strong> ${formatDate(order.estimatedDeliveryTime)}</p>
                        
                        <h4>📍 Adresse de livraison:</h4>
                        <p>${order.customer.address.street}<br>
                        ${order.customer.address.city}, ${order.customer.address.postalCode}<br>
                        Zone: ${order.customer.address.zone}</p>
                        
                        <h4>🛒 Articles commandés:</h4>
                        ${order.items.map(item => `
                            <div class="item">
                                <span>${item.quantity}x ${item.name}</span>
                                <span style="float: right;">${item.price.toFixed(2)}€</span>
                            </div>
                        `).join('')}
                        
                        <div class="item">
                            <span>Frais de livraison</span>
                            <span style="float: right;">${order.deliveryFee.toFixed(2)}€</span>
                        </div>
                        
                        <div class="total">
                            <span>Total</span>
                            <span style="float: right;">${order.finalAmount.toFixed(2)}€</span>
                        </div>
                        
                        <p><strong>Mode de paiement:</strong> ${getPaymentMethodText(order.paymentMethod)}</p>
                        
                        ${order.specialInstructions ? `
                            <h4>📝 Instructions spéciales:</h4>
                            <p>${order.specialInstructions}</p>
                        ` : ''}
                    </div>
                    
                    <p>Vous pouvez suivre votre commande en temps réel sur notre site web avec le numéro de commande ci-dessus.</p>
                    
                    <p>Si vous avez des questions, n'hésitez pas à nous contacter :</p>
                    <ul>
                        <li>📞 Téléphone: +262 692 XX XX XX</li>
                        <li>📧 Email: contact@tikaz-livre.re</li>
                        <li>💬 WhatsApp: +262 692 XX XX XX</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Merci de faire confiance à TiKaz Livré !</p>
                    <p>L'équipe TiKaz Livré 🇷🇪</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'TiKaz Livré <noreply@tikaz-livre.re>',
            to: order.customer.email,
            subject: `Confirmation de commande #${order.orderNumber} - TiKaz Livré`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Order confirmation email sent to:', order.customer.email);

    } catch (error) {
        console.error('❌ Order confirmation email error:', error);
        throw error;
    }
};

// Send contact form confirmation email
const sendContactConfirmationEmail = async (contact) => {
    try {
        const transporter = createTransporter();

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .message-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍽️ TiKaz Livré</h1>
                    <h2>Message Reçu</h2>
                </div>
                
                <div class="content">
                    <h3>Bonjour ${contact.name},</h3>
                    <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
                    
                    <div class="message-details">
                        <h4>📋 Détails de votre message:</h4>
                        <p><strong>Sujet:</strong> ${contact.subject}</p>
                        <p><strong>Type:</strong> ${getContactTypeText(contact.type)}</p>
                        <p><strong>Date d'envoi:</strong> ${formatDate(contact.createdAt)}</p>
                        
                        <h4>💬 Votre message:</h4>
                        <p style="background: #f5f5f5; padding: 10px; border-radius: 3px;">${contact.message}</p>
                    </div>
                    
                    <p>Notre équipe va examiner votre message et vous répondra dans les plus brefs délais, généralement sous 24-48 heures.</p>
                    
                    <p>Si votre demande est urgente, vous pouvez également nous contacter directement :</p>
                    <ul>
                        <li>📞 Téléphone: +262 692 XX XX XX</li>
                        <li>💬 WhatsApp: +262 692 XX XX XX</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Merci de faire confiance à TiKaz Livré !</p>
                    <p>L'équipe TiKaz Livré 🇷🇪</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'TiKaz Livré <noreply@tikaz-livre.re>',
            to: contact.email,
            subject: `Message reçu: ${contact.subject} - TiKaz Livré`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Contact confirmation email sent to:', contact.email);

    } catch (error) {
        console.error('❌ Contact confirmation email error:', error);
        throw error;
    }
};

// Notify admin of new contact
const notifyAdminNewContact = async (contact) => {
    try {
        const transporter = createTransporter();

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ff6b35; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .contact-details { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .priority-${contact.priority} { border-left: 4px solid ${getPriorityColor(contact.priority)}; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🆕 Nouveau Message de Contact</h1>
                </div>
                
                <div class="content">
                    <div class="contact-details priority-${contact.priority}">
                        <h3>📧 ${contact.subject}</h3>
                        <p><strong>De:</strong> ${contact.name} (${contact.email})</p>
                        ${contact.phone ? `<p><strong>Téléphone:</strong> ${contact.phone}</p>` : ''}
                        <p><strong>Type:</strong> ${getContactTypeText(contact.type)}</p>
                        <p><strong>Priorité:</strong> ${contact.priority.toUpperCase()}</p>
                        <p><strong>Reçu le:</strong> ${formatDate(contact.createdAt)}</p>
                        
                        <h4>💬 Message:</h4>
                        <p style="background: white; padding: 10px; border-radius: 3px;">${contact.message}</p>
                        
                        <p><strong>IP:</strong> ${contact.ipAddress}</p>
                    </div>
                    
                    <p>Connectez-vous au tableau de bord administrateur pour répondre à ce message.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'TiKaz Livré <noreply@tikaz-livre.re>',
            to: process.env.ADMIN_EMAIL || 'admin@tikaz-livre.re',
            subject: `[ADMIN] Nouveau contact: ${contact.subject}`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Admin notification email sent for contact:', contact._id);

    } catch (error) {
        console.error('❌ Admin notification email error:', error);
        throw error;
    }
};

// Send response email to customer
const sendContactResponseEmail = async (contact) => {
    try {
        const transporter = createTransporter();

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .message-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .response { background: #e8f5e8; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4caf50; }
                .footer { text-align: center; padding: 20px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍽️ TiKaz Livré</h1>
                    <h2>Réponse à votre Message</h2>
                </div>
                
                <div class="content">
                    <h3>Bonjour ${contact.name},</h3>
                    <p>Nous avons une réponse à votre message concernant: <strong>${contact.subject}</strong></p>
                    
                    <div class="message-details">
                        <h4>📋 Votre message original:</h4>
                        <p><em>${contact.message}</em></p>
                    </div>
                    
                    <div class="response">
                        <h4>💬 Notre réponse:</h4>
                        <p>${contact.response.message}</p>
                        <p><small><strong>Répondu par:</strong> ${contact.response.respondedBy} le ${formatDate(contact.response.respondedAt)}</small></p>
                    </div>
                    
                    <p>Si vous avez d'autres questions, n'hésitez pas à nous recontacter.</p>
                    
                    <p>Vous pouvez nous joindre :</p>
                    <ul>
                        <li>📞 Téléphone: +262 692 XX XX XX</li>
                        <li>📧 Email: contact@tikaz-livre.re</li>
                        <li>💬 WhatsApp: +262 692 XX XX XX</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Merci de faire confiance à TiKaz Livré !</p>
                    <p>L'équipe TiKaz Livré 🇷🇪</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'TiKaz Livré <noreply@tikaz-livre.re>',
            to: contact.email,
            subject: `Re: ${contact.subject} - TiKaz Livré`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Contact response email sent to:', contact.email);

    } catch (error) {
        console.error('❌ Contact response email error:', error);
        throw error;
    }
};

// Helper functions
const getStatusText = (status) => {
    const statusMap = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'preparing': 'En préparation',
        'ready': 'Prête',
        'delivering': 'En livraison',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
    };
    return statusMap[status] || status;
};

const getPaymentMethodText = (method) => {
    const methodMap = {
        'cash': 'Espèces à la livraison',
        'card': 'Carte bancaire',
        'mobile_money': 'Mobile Money',
        'bank_transfer': 'Virement bancaire'
    };
    return methodMap[method] || method;
};

const getContactTypeText = (type) => {
    const typeMap = {
        'general': 'Demande générale',
        'complaint': 'Réclamation',
        'suggestion': 'Suggestion',
        'partnership': 'Partenariat',
        'technical': 'Problème technique'
    };
    return typeMap[type] || type;
};

const getPriorityColor = (priority) => {
    const colorMap = {
        'low': '#4caf50',
        'medium': '#ff9800',
        'high': '#f44336',
        'urgent': '#9c27b0'
    };
    return colorMap[priority] || '#4caf50';
};

const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

module.exports = {
    sendOrderConfirmationEmail,
    sendContactConfirmationEmail,
    notifyAdminNewContact,
    sendContactResponseEmail
};
