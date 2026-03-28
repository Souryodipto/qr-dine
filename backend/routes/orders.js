const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Payout = require('../models/Payout');
const authMiddleware = require('../middleware/authMiddleware');
const restaurantGuard = require('../middleware/restaurantGuard');

const { emitOrderUpdate } = require('../services/socketService');
const { sendEBillEmail } = require('../services/emailService');
const Restaurant = require('../models/Restaurant');

// All routes require restaurant auth
router.use(authMiddleware, restaurantGuard);

// GET /api/orders — Get orders for the restaurant (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, paymentStatus, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const filter = { restaurantId: req.restaurantId };

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/live — Get live (active) orders for the restaurant
router.get('/live', async (req, res) => {
  try {
    const orders = await Order.find({
      restaurantId: req.restaurantId,
      orderStatus: { $in: ['new', 'preparing', 'ready'] },
      paymentStatus: 'paid'
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get live orders error:', error);
    res.status(500).json({ message: 'Failed to fetch live orders.' });
  }
});

// GET /api/orders/stats — Order stats for the restaurant
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const baseFilter = { restaurantId: req.restaurantId, paymentStatus: 'paid' };

    const [todayOrders, totalOrders, todayRevenue, totalRevenue, statusAgg] = await Promise.all([
      Order.countDocuments({ ...baseFilter, createdAt: { $gte: todayStart } }),
      Order.countDocuments(baseFilter),
      Order.aggregate([
        { $match: { ...baseFilter, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: baseFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: req.restaurantId, paymentStatus: 'paid' } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ])
    ]);

    // Build statusCounts object
    const statusCounts = { new: 0, preparing: 0, ready: 0, completed: 0 };
    statusAgg.forEach(s => { statusCounts[s._id] = s.count; });

    res.json({
      todayOrders,
      totalOrders,
      todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      statusCounts
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Failed to fetch order stats.' });
  }
});

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'preparing', 'ready', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.orderStatus = status;
    await order.save();

    // Emit real-time update
    emitOrderUpdate(req.restaurantId, order._id, status);

    // Send e-bill when order is completed
    if (status === 'completed' && order.customerEmail) {
      Restaurant.findById(req.restaurantId).then(restaurant => {
        if (restaurant) {
          sendEBillEmail(order, restaurant)
            .then(r => { if (r?.success) console.log(`🧾 E-bill sent to ${order.customerEmail}`); })
            .catch(err => console.error('E-bill email error:', err.message));
        }
      });
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status.' });
  }
});

// GET /api/orders/daily-earnings — Last 30 days daily revenue breakdown
router.get('/daily-earnings', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    const results = await Order.aggregate([
      {
        $match: {
          restaurantId: req.restaurantId,
          paymentStatus: 'paid',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalAmount: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Build a map keyed by YYYY-MM-DD
    const earningsMap = {};
    results.forEach(r => {
      const dateStr = `${r._id.year}-${String(r._id.month).padStart(2,'0')}-${String(r._id.day).padStart(2,'0')}`;
      earningsMap[dateStr] = { amount: r.totalAmount, orders: r.orderCount };
    });

    // Fill all 30 days so frontend always has a complete list
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      days.push({
        date: key,
        amount: earningsMap[key]?.amount || 0,
        orders: earningsMap[key]?.orders || 0
      });
    }

    res.json(days);
  } catch (error) {
    console.error('Daily earnings error:', error);
    res.status(500).json({ message: 'Failed to fetch daily earnings.' });
  }
});

// GET /api/orders/daily-earnings-summary — Today & yesterday earnings w/ payout status
router.get('/daily-earnings-summary', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 86400000);
    const yestStart  = new Date(todayStart.getTime() - 86400000);
    const yestEnd    = todayStart;

    const rid = req.restaurantId;

    const [todayAgg, yestAgg, todayPayout, yestPayout] = await Promise.all([
      Order.aggregate([
        { $match: { restaurantId: rid, paymentStatus: 'paid', createdAt: { $gte: todayStart, $lt: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: rid, paymentStatus: 'paid', createdAt: { $gte: yestStart, $lt: yestEnd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Payout.findOne({ restaurantId: rid, createdAt: { $gte: todayStart, $lt: todayEnd } }).sort({ createdAt: -1 }),
      Payout.findOne({ restaurantId: rid, createdAt: { $gte: yestStart, $lt: yestEnd } }).sort({ createdAt: -1 }),
    ]);

    res.json({
      today: {
        amount: todayAgg[0]?.total || 0,
        orders: todayAgg[0]?.count  || 0,
        payoutStatus: todayPayout ? todayPayout.status : null,
      },
      yesterday: {
        amount: yestAgg[0]?.total || 0,
        orders: yestAgg[0]?.count  || 0,
        payoutStatus: yestPayout ? yestPayout.status : null,
      },
    });
  } catch (error) {
    console.error('Daily earnings summary error:', error);
    res.status(500).json({ message: 'Failed to fetch daily earnings summary.' });
  }
});

module.exports = router;
