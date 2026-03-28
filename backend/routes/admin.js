const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const Restaurant = require('../models/Restaurant');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Table = require('../models/Table');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Payout = require('../models/Payout');
const authMiddleware = require('../middleware/authMiddleware');
const superAdminGuard = require('../middleware/superAdminGuard');

// All routes require super admin auth
router.use(authMiddleware, superAdminGuard);

// GET /api/admin/dashboard — Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments({ isDeleted: false });
    const activeRestaurants = await Restaurant.countDocuments({ isActive: true, isDeleted: false });
    const inactiveRestaurants = totalRestaurants - activeRestaurants;

    // Order stats
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, weekOrders, monthOrders, totalOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: todayStart }, paymentStatus: 'paid' }),
      Order.countDocuments({ createdAt: { $gte: weekStart }, paymentStatus: 'paid' }),
      Order.countDocuments({ createdAt: { $gte: monthStart }, paymentStatus: 'paid' }),
      Order.countDocuments({ paymentStatus: 'paid' })
    ]);

    // Stats from Subscriptions
    const subAgg = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: null, mrr: { $sum: '$plan.price' }, count: { $sum: 1 } } }
    ]);
    const monthlyRecurringRevenue = subAgg.length > 0 ? subAgg[0].mrr : 0;
    const activeSubscriptions = subAgg.length > 0 ? subAgg[0].count : 0;

    res.json({
      totalRestaurants,
      activeRestaurants,
      inactiveRestaurants,
      orderStats: { today: todayOrders, thisWeek: weekOrders, thisMonth: monthOrders, total: totalOrders },
      totalRevenue,
      mrr: monthlyRecurringRevenue,
      activeSubscriptions,
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard stats.' });
  }
});

// --- PLAN ROUTES ---

router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plans.' });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create plan.' });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update plan.' });
  }
});

// --- SUBSCRIPTION ROUTES ---

router.get('/subscriptions', async (req, res) => {
  try {
    const subs = await Subscription.find()
      .populate('restaurantId', 'name slug')
      .populate('planId', 'name price')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscriptions.' });
  }
});

// GET /api/admin/restaurants — List all restaurants
router.get('/restaurants', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Restaurant.countDocuments(filter)
    ]);

    // Get order counts and revenue per restaurant
    const restaurantIds = restaurants.map(r => r._id);
    const orderStats = await Order.aggregate([
      { $match: { restaurantId: { $in: restaurantIds }, paymentStatus: 'paid' } },
      { $group: { _id: '$restaurantId', totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } }
    ]);

    const statsMap = {};
    orderStats.forEach(s => { statsMap[s._id.toString()] = s; });

    const enriched = restaurants.map(r => ({
      ...r.toJSON(),
      totalOrders: statsMap[r._id.toString()]?.totalOrders || 0,
      totalRevenue: statsMap[r._id.toString()]?.totalRevenue || 0
    }));

    res.json({ restaurants: enriched, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('List restaurants error:', error);
    res.status(500).json({ message: 'Failed to list restaurants.' });
  }
});

// POST /api/admin/restaurants — Create new restaurant
router.post('/restaurants', async (req, res) => {
  try {
    const { name, ownerName, email, phone, address, city, pincode, cuisineTags, subdomain, planId } = req.body;

    if (!name || !ownerName || !email) {
      return res.status(400).json({ message: 'Name, owner name, and email are required.' });
    }

    // Check email & subdomain uniqueness
    const existing = await Restaurant.findOne({ $or: [{ email }, { subdomain: subdomain?.toLowerCase() }] });
    if (existing) {
      if (existing.email === email) return res.status(400).json({ message: 'Email already exists.' });
      if (subdomain && existing.subdomain === subdomain.toLowerCase()) return res.status(400).json({ message: 'Subdomain already exists.' });
    }

    // Generate slug
    const baseSlug = slugify(name, { lower: true, strict: true });
    const shortUuid = uuidv4().split('-')[0];
    const slug = `${baseSlug}-${shortUuid}`;

    const password = 'Rest@' + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 100);
    const passwordHash = await bcrypt.hash(password, 12);

    const restaurant = await Restaurant.create({
      slug,
      subdomain: subdomain?.toLowerCase() || undefined,
      name,
      ownerName,
      email,
      passwordHash,
      phone: phone || '',
      address: address || '',
      city: city || '',
      pincode: pincode || '',
      cuisineTags: cuisineTags || []
    });

    // Initialize Subscription if planId provided
    if (planId) {
      const plan = await Plan.findById(planId);
      if (plan) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        const sub = await Subscription.create({
          restaurantId: restaurant._id,
          planId: plan._id,
          endDate,
          status: 'active'
        });
        restaurant.currentSubscription = sub._id;
        await restaurant.save();
      }
    }

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant: restaurant.toJSON(),
      credentials: { email, password }, // Show password once
      menuUrl: `/menu/${slug}`
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ message: 'Failed to create restaurant.' });
  }
});

// GET /api/admin/restaurants/:id — Get single restaurant
router.get('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }
    res.json(restaurant.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch restaurant.' });
  }
});

// PUT /api/admin/restaurants/:id — Edit restaurant
router.put('/restaurants/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates.passwordHash; // Never allow password update through this route
    delete updates.slug; // Slug is immutable

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    res.json({ message: 'Restaurant updated', restaurant: restaurant.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update restaurant.' });
  }
});

// PATCH /api/admin/restaurants/:id/toggle — Activate/Deactivate
router.patch('/restaurants/:id/toggle', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.json({ message: `Restaurant ${restaurant.isActive ? 'activated' : 'deactivated'}`, isActive: restaurant.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle restaurant status.' });
  }
});

// DELETE /api/admin/restaurants/:id — Soft delete
router.delete('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    res.json({ message: 'Restaurant deleted (soft delete)' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete restaurant.' });
  }
});

// PATCH /api/admin/restaurants/:id/reset-password — Reset restaurant password
router.patch('/restaurants/:id/reset-password', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    const newPassword = 'Rest@' + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 100);
    restaurant.passwordHash = await bcrypt.hash(newPassword, 12);
    await restaurant.save();

    res.json({ message: 'Password reset successful', newPassword });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password.' });
  }
});

// GET /api/admin/orders — All platform orders (read-only)
router.get('/orders', async (req, res) => {
  try {
    const { restaurant, status, paymentStatus, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (restaurant) filter.restaurantId = restaurant;
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('restaurantId', 'name slug'),
      Order.countDocuments(filter)
    ]);

    res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

// GET /api/admin/settings — Platform settings
router.get('/settings', async (req, res) => {
  res.json({
    platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT) || 5,
    platformName: process.env.PLATFORM_NAME || 'QR Dine'
  });
});

// POST /api/admin/seed-test-data — Create dummy restaurants and menus for testing
router.post('/seed-test-data', async (req, res) => {
  try {
    // 1. Ensure at least one Plan exists
    let plan = await Plan.findOne();
    if (!plan) {
      plan = await Plan.create({
        name: 'Starter Plan',
        price: 999,
        features: ['Up to 500 orders/mo', 'Basic Analytics', '3 QR Tables'],
        maxOrders: 500
      });
    }

    const dummyData = [
      {
        name: 'The Burger Joint',
        cuisine: ['Burgers', 'American', 'Fast Food'],
        categories: [
          { name: 'Signature Burgers', items: [
            { name: 'Classic Cheeseburger', price: 249, description: 'Juicy beef patty with cheddar cheese', dietType: 'non-veg' },
            { name: 'Spicy Veggie Burger', price: 199, description: 'Crispy veg patty with chipotle mayo', dietType: 'veg', isBestSeller: true }
          ]},
          { name: 'Sides', items: [
            { name: 'Cajun Fries', price: 129, description: 'Crispy fries with spicy cajun seasoning', dietType: 'veg' },
            { name: 'Onion Rings', price: 149, description: 'Golden fried onion rings with dip', dietType: 'veg' }
          ]}
        ]
      },
      {
        name: 'Sushi Zen',
        cuisine: ['Japanese', 'Sushi', 'Seafood'],
        categories: [
          { name: 'Maki Rolls', items: [
            { name: 'California Roll', price: 449, description: 'Crab stick, avocado, and cucumber', dietType: 'non-veg' },
            { name: 'Dragon Roll', price: 599, description: 'Eel and cucumber topped with avocado', dietType: 'non-veg', isChefSpecial: true }
          ]},
          { name: 'Ramen', items: [
            { name: 'Miso Ramen', price: 399, description: 'Rich miso broth with tofu and seaweed', dietType: 'veg' },
            { name: 'Tonkotsu Ramen', price: 499, description: 'Creamy pork broth with chashu pork', dietType: 'non-veg' }
          ]}
        ]
      }
    ];

    const results = [];

    for (const data of dummyData) {
      // Create Restaurant
      const baseSlug = slugify(data.name, { lower: true, strict: true });
      const shortUuid = uuidv4().split('-')[0];
      const slug = `${baseSlug}-${shortUuid}`;
      const email = `${baseSlug}${shortUuid}@test.com`;
      const passwordHash = await bcrypt.hash('password123', 12);

      const restaurant = await Restaurant.create({
        name: data.name,
        slug,
        email,
        ownerName: 'Test Owner',
        passwordHash,
        cuisineTags: data.cuisine,
        city: 'Test City',
        isActive: true
      });

      // Create Subscription
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      const sub = await Subscription.create({
        restaurantId: restaurant._id,
        planId: plan._id,
        endDate,
        status: 'active'
      });
      restaurant.currentSubscription = sub._id;
      await restaurant.save();

      // Create Categories and Menu Items
      for (const catData of data.categories) {
        const category = await Category.create({
          restaurantId: restaurant._id,
          name: catData.name,
          displayOrder: 0
        });

        for (const itemData of catData.items) {
          await MenuItem.create({
            restaurantId: restaurant._id,
            categoryId: category._id,
            ...itemData
          });
        }
      }

      results.push({ name: restaurant.name, slug: restaurant.slug, email: restaurant.email });
    }

    res.status(201).json({
      message: 'Test data seeded successfully',
      created: results
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ message: 'Failed to seed test data.' });
  }
});

// GET /api/admin/payouts — Get all payouts globally
router.get('/payouts', async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate('restaurantId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load payouts.' });
  }
});

// POST /api/admin/payouts — Create a new payout
router.post('/payouts', async (req, res) => {
  try {
    const { restaurantId, amount, status, type, referenceId, method, notes } = req.body;
    if (!restaurantId || !amount || !method) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }
    const payout = await Payout.create({
      restaurantId, amount, status, type, referenceId, method, notes
    });
    
    // fetch populated to return immediately
    const populated = await Payout.findById(payout._id).populate('restaurantId', 'name email phone');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payout.' });
  }
});

// PUT /api/admin/payouts/:id — Update a payout
router.put('/payouts/:id', async (req, res) => {
  try {
    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('restaurantId', 'name email phone');
    if (!payout) return res.status(404).json({ message: 'Payout not found.' });
    res.json(payout);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payout.' });
  }
});

// DELETE /api/admin/payouts/:id — Delete a payout (if mistake)
router.delete('/payouts/:id', async (req, res) => {
  try {
    const payout = await Payout.findByIdAndDelete(req.params.id);
    if (!payout) return res.status(404).json({ message: 'Payout not found.' });
    res.json({ message: 'Payout deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete payout.' });
  }
});

// GET /api/admin/earnings-overview — Today & yesterday earnings per restaurant + payout status
router.get('/earnings-overview', async (req, res) => {
  try {
    const now = new Date();
    const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd     = new Date(todayStart.getTime() + 86400000);
    const yestStart    = new Date(todayStart.getTime() - 86400000);
    const yestEnd      = todayStart;

    const restaurants = await Restaurant.find({ isDeleted: false, isActive: true }).select('_id name logo paymentInfo');

    const results = await Promise.all(restaurants.map(async (r) => {
      const rid = r._id;

      const [todayAgg, yestAgg, todayPayout, yestPayout] = await Promise.all([
        // today's order revenue
        Order.aggregate([
          { $match: { restaurantId: rid, paymentStatus: 'paid', createdAt: { $gte: todayStart, $lt: todayEnd } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]),
        // yesterday's order revenue
        Order.aggregate([
          { $match: { restaurantId: rid, paymentStatus: 'paid', createdAt: { $gte: yestStart, $lt: yestEnd } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]),
        // any payout logged for today
        Payout.findOne({ restaurantId: rid, createdAt: { $gte: todayStart, $lt: todayEnd } }).sort({ createdAt: -1 }),
        // any payout logged for yesterday
        Payout.findOne({ restaurantId: rid, createdAt: { $gte: yestStart, $lt: yestEnd } }).sort({ createdAt: -1 }),
      ]);

      const todayEarning   = todayAgg[0]?.total || 0;
      const todayOrders    = todayAgg[0]?.count  || 0;
      const yestEarning    = yestAgg[0]?.total   || 0;
      const yestOrders     = yestAgg[0]?.count   || 0;

      return {
        _id: r._id,
        name: r.name,
        logo: r.logo,
        today:     { amount: todayEarning, orders: todayOrders, payout: todayPayout ? { status: todayPayout.status, _id: todayPayout._id } : null },
        yesterday: { amount: yestEarning,  orders: yestOrders,  payout: yestPayout  ? { status: yestPayout.status,  _id: yestPayout._id  }  : null },
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('Earnings overview error:', error);
    res.status(500).json({ message: 'Failed to load earnings overview.' });
  }
});

// POST /api/admin/payouts/quick-send — Send today's/yesterday's earnings directly as payout
router.post('/payouts/quick-send', async (req, res) => {
  try {
    const { restaurantId, amount, day, method = 'Bank', notes } = req.body;
    if (!restaurantId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'restaurantId and a positive amount are required.' });
    }

    const dateLabel = day === 'yesterday' ? 'Yesterday' : 'Today';
    const payout = await Payout.create({
      restaurantId,
      amount: parseFloat(amount),
      status: 'Paid',
      type: 'Payout',
      method,
      referenceId: `DAILY-${dateLabel.toUpperCase()}-${Date.now()}`,
      notes: notes || `${dateLabel}'s daily order earnings auto-disbursement.`,
    });

    const populated = await Payout.findById(payout._id).populate('restaurantId', 'name email phone');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Quick send error:', error);
    res.status(500).json({ message: 'Failed to send payout.' });
  }
});

module.exports = router;
