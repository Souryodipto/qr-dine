const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');

// GET /api/public/menu/:slug — Get full menu for a restaurant
router.get('/menu/:slug', async (req, res) => {
  try {
    let slug = req.params.slug;
    
    // If slug is 'default' and we have a tenant from subdomain, use that
    if ((slug === 'default' || !slug) && req.tenantSlug) {
      slug = req.tenantSlug;
    }

    const restaurant = await Restaurant.findOne({ slug, isDeleted: false });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.', status: 'not_found' });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({ 
        message: 'This restaurant is currently unavailable.',
        status: 'inactive',
        restaurantName: restaurant.name
      });
    }

    const categories = await Category.find({ 
      restaurantId: restaurant._id, 
      isVisible: true 
    }).sort({ displayOrder: 1 });

    const menuItems = await MenuItem.find({ 
      restaurantId: restaurant._id,
      categoryId: { $in: categories.map(c => c._id) }
    }).sort({ displayOrder: 1 });

    // Group items by category
    const menuByCategory = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      items: menuItems.filter(item => item.categoryId.toString() === cat._id.toString())
    }));

    // Status: isAcceptingOrders is the single source of truth (manual toggle wins)
    // isCurrentlyOpen() is used only for display — it does NOT override the manual flag
    const isOpen = restaurant.isAcceptingOrders !== false;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayHours = restaurant.operatingHours[today];

    res.json({
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo: restaurant.logo,
        coverImage: restaurant.coverImage,
        description: restaurant.description,
        cuisineTags: restaurant.cuisineTags,
        currency: restaurant.currency,
        paymentInfo: restaurant.paymentInfo,
        estimatedPrepTime: restaurant.estimatedPrepTime,
        customMessage: restaurant.customMessage,
        brandColor: restaurant.brandColor,
        location: restaurant.location,
        socialLinks: restaurant.socialLinks,
        isOpen,
        operatingHours: restaurant.operatingHours,
        todayHours
      },
      menu: menuByCategory
    });
  } catch (error) {
    console.error('Public menu error:', error);
    res.status(500).json({ message: 'Failed to load menu.' });
  }
});

// GET /api/public/table/:slug/:tableNumber — Validate table
router.get('/table/:slug/:tableNumber', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isDeleted: false });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.', status: 'not_found' });
    }
    if (!restaurant.isActive) {
      return res.status(403).json({ message: 'Restaurant is unavailable.', status: 'inactive' });
    }

    const table = await Table.findOne({ 
      restaurantId: restaurant._id, 
      tableNumber: parseInt(req.params.tableNumber) 
    });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found.', status: 'not_found' });
    }
    if (!table.isActive) {
      return res.status(403).json({ message: 'This table is currently unavailable.', status: 'table_inactive' });
    }

    res.json({ 
      valid: true, 
      table: { _id: table._id, tableName: table.tableName, tableNumber: table.tableNumber }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate table.' });
  }
});

// GET /api/public/orders/session/:sessionId — Get orders for a specific session (for tracking)
router.get('/orders/session/:sessionId', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Fetch session orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

// POST /api/public/place-order — Place order without payment (public)
router.post('/place-order', async (req, res) => {
  try {
    const { restaurantId, items, customerName, customerEmail, customerPhone, tableNumber, specialInstructions, customerId, orderType } = req.body;

    if (!restaurantId || !items || !items.length || !customerName) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const { emitNewOrder } = require('../services/socketService');
    const { sendOrderConfirmationEmail } = require('../services/emailService');
    const mongoose = require('mongoose');

    // Use tenantId if present (from subdomain) or restaurantId from body
    const finalRestaurantId = restaurantId || req.tenantId;
    if (!finalRestaurantId) return res.status(400).json({ message: 'Restaurant ID is required.' });

    // Safe lookup: use findById only if it's a valid ObjectId, otherwise fall back to slug
    let restaurant;
    if (mongoose.Types.ObjectId.isValid(finalRestaurantId)) {
      restaurant = await Restaurant.findById(finalRestaurantId);
    } else {
      restaurant = await Restaurant.findOne({ slug: finalRestaurantId, isDeleted: false });
    }
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });

    // Status check: manual flag is authoritative. Do NOT block if owner has manually set open.
    const isOpen = restaurant.isAcceptingOrders !== false;
    if (!isOpen) {
      return res.status(403).json({ 
        message: 'Restaurant is currently closed or not accepting orders.',
        isOpen: false,
        todayHours: restaurant.operatingHours[['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()]]
      });
    }

    // Calculate totals and enrich items
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = 0;
    const totalAmount = subtotal;

    // Create order marked as paid (or 'pending' based on business logic, 
    // but the user wants "all without payment" so we bypass any payment requirement)
    const order = await Order.create({
      restaurantId: restaurant._id,
      customerId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      items: items.map(item => ({
        ...item,
        // Ensure properties match model if not already present
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      subtotal,
      taxAmount,
      totalAmount,
      tableNumber: (orderType === 'Dine-In' && tableNumber) ? parseInt(tableNumber) || null : null,
      orderType: orderType || 'Dine-In',
      specialInstructions: specialInstructions || '',
      paymentStatus: 'paid', // Bypass payment checks in dashboards
      paymentMethod: 'counter',
      sessionId: req.body.sessionId || ''
    });

    // Notify restaurant via socket
    emitNewOrder(restaurant._id.toString(), order);

    // Send order confirmation email to customer (fire-and-forget)
    if (order.customerEmail) {
      sendOrderConfirmationEmail(order, restaurant).then(result => {
        if (result?.success) console.log(`📧 Confirmation sent to ${order.customerEmail}`);
      }).catch(err => console.error('Confirmation email error:', err.message));
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ message: 'Failed to place order.' });
  }
});

module.exports = router;
