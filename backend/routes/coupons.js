const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const authMiddleware = require('../middleware/authMiddleware');
const restaurantGuard = require('../middleware/restaurantGuard');

// All routes require restaurant auth
router.use(authMiddleware, restaurantGuard);

// GET /api/coupons — List all coupons for the restaurant
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({ restaurantId: req.restaurantId }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coupons.' });
  }
});

// POST /api/coupons — Create a coupon
router.post('/', async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, endDate } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ message: 'Code and discount value are required.' });
    }

    const coupon = await Coupon.create({
      restaurantId: req.restaurantId,
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      endDate: endDate ? new Date(endDate) : null
    });

    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A coupon with this code already exists.' });
    }
    res.status(500).json({ message: 'Failed to create coupon.' });
  }
});

// PATCH /api/coupons/:id/toggle — Toggle coupon status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle coupon.' });
  }
});

// DELETE /api/coupons/:id — Delete a coupon
router.delete('/:id', async (req, res) => {
  try {
    await Coupon.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    res.json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete coupon.' });
  }
});

// Public verification (Customer side)
// GET /api/coupons/validate/:code?restaurantId=...
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { restaurantId } = req.query;

    const coupon = await Coupon.findOne({ 
      restaurantId, 
      code: code.toUpperCase(), 
      isActive: true 
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon code.' });
    }

    if (coupon.endDate && new Date() > coupon.endDate) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({ message: 'This coupon has expired.' });
    }

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate coupon.' });
  }
});

module.exports = router;
