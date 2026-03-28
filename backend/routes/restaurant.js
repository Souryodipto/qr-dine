const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Restaurant = require('../models/Restaurant');
const Payout = require('../models/Payout');
const authMiddleware = require('../middleware/authMiddleware');
const restaurantGuard = require('../middleware/restaurantGuard');
const { upload, uploadToCloudinary } = require('../services/cloudinaryService');

// All routes require restaurant auth
router.use(authMiddleware, restaurantGuard);

// GET /api/restaurant/profile — Get own profile
router.get('/profile', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }
    res.json(restaurant.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// PUT /api/restaurant/profile — Update own profile
router.put('/profile', async (req, res) => {
  try {
    const allowedFields = [
      'name', 'description', 'phone', 'address', 'city', 'pincode',
      'cuisineTags', 'operatingHours', 'estimatedPrepTime', 'customMessage',
      'currency', 'paymentInfo', 'brandColor', 'logo', 'isAcceptingOrders'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.restaurantId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated', restaurant: restaurant.toJSON() });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// POST /api/restaurant/upload/logo — Upload logo
router.post('/upload/logo', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, req.restaurantId, 'logo');
    await Restaurant.findByIdAndUpdate(req.restaurantId, { logo: imageUrl });

    res.json({ message: 'Logo uploaded', imageUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Failed to upload logo.' });
  }
});

// POST /api/restaurant/upload/cover — Upload cover image
router.post('/upload/cover', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, req.restaurantId, 'cover');
    await Restaurant.findByIdAndUpdate(req.restaurantId, { coverImage: imageUrl });

    res.json({ message: 'Cover image uploaded', imageUrl });
  } catch (error) {
    console.error('Cover upload error:', error);
    res.status(500).json({ message: 'Failed to upload cover image.' });
  }
});

// PUT /api/restaurant/change-password — Change own password
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const restaurant = await Restaurant.findById(req.restaurantId);
    const isMatch = await restaurant.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    restaurant.passwordHash = await bcrypt.hash(newPassword, 12);
    await restaurant.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

// GET /api/restaurant/analytics — Restaurant analytics
router.get('/analytics', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const restaurantId = req.restaurantId;

    // Top 10 items
    const topItems = await Order.aggregate([
      { $match: { restaurantId: require('mongoose').Types.ObjectId.createFromHexString(restaurantId), paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Revenue last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Order.aggregate([
      { $match: { restaurantId: require('mongoose').Types.ObjectId.createFromHexString(restaurantId), paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Peak hours heatmap
    const peakHours = await Order.aggregate([
      { $match: { restaurantId: require('mongoose').Types.ObjectId.createFromHexString(restaurantId), paymentStatus: 'paid' } },
      { $group: { _id: { hour: { $hour: '$createdAt' }, day: { $dayOfWeek: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Summary
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [allTimeStats, monthStats, uniqueCustomers] = await Promise.all([
      Order.aggregate([
        { $match: { restaurantId: require('mongoose').Types.ObjectId.createFromHexString(restaurantId), paymentStatus: 'paid' } },
        { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' }, avgOrderValue: { $avg: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: require('mongoose').Types.ObjectId.createFromHexString(restaurantId), paymentStatus: 'paid', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } }
      ]),
      Order.distinct('customerEmail', { restaurantId: require('mongoose').Types.ObjectId.createFromHexString(restaurantId), paymentStatus: 'paid' })
    ]);

    res.json({
      topItems,
      dailyRevenue,
      peakHours,
      summary: {
        allTime: allTimeStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
        thisMonth: monthStats[0] || { totalOrders: 0, totalRevenue: 0 },
        uniqueCustomers: uniqueCustomers.length
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics.' });
  }
});

// PUT /api/restaurant/operating-hours — Set per-day hours
// Auto-updates isAcceptingOrders to match the current schedule after saving hours
router.put('/operating-hours', async (req, res) => {
  try {
    const { operatingHours } = req.body;
    if (!operatingHours) {
      return res.status(400).json({ message: 'operatingHours is required.' });
    }

    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });

    // Save the new operating hours
    restaurant.operatingHours = operatingHours;

    // Calculate whether restaurant should be open right now based on new hours
    // This gives a sensible default — owner can still manually override via the toggle
    const shouldBeOpen = restaurant.isCurrentlyOpen();
    restaurant.isAcceptingOrders = shouldBeOpen;

    await restaurant.save();

    res.json({
      message: 'Operating hours saved.',
      isAcceptingOrders: restaurant.isAcceptingOrders,
      restaurant: restaurant.toJSON()
    });
  } catch (error) {
    console.error('Operating hours update error:', error);
    res.status(500).json({ message: 'Failed to update operating hours.' });
  }
});


// GET /api/restaurant/payouts — Get own payouts
router.get('/payouts', async (req, res) => {
  try {
    const payouts = await Payout.find({ restaurantId: req.restaurantId }).sort({ createdAt: -1 });
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load payouts.' });
  }
});

module.exports = router;
