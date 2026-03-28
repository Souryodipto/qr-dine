const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const { loginLimiter } = require('../middleware/rateLimiter');

// ─── Restaurant Self-Registration ───
// POST /api/auth/register
router.post('/register', loginLimiter, async (req, res) => {
  try {
    const { ownerName, email, password, name } = req.body;

    if (!ownerName || !email || !password || !name) {
      return res.status(400).json({ message: 'Owner name, restaurant name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check email uniqueness
    const existing = await Restaurant.findOne({ email, isDeleted: false });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Generate unique slug
    const baseSlug = slugify(name, { lower: true, strict: true });
    const shortUuid = uuidv4().split('-')[0];
    const slug = `${baseSlug}-${shortUuid}`;

    const passwordHash = await bcrypt.hash(password, 12);

    const restaurant = await Restaurant.create({
      slug,
      name,
      ownerName,
      email,
      passwordHash,
      isActive: true,
    });

    const token = jwt.sign(
      { id: restaurant._id, restaurantId: restaurant._id.toString(), email: restaurant.email, role: 'restaurant', slug: restaurant.slug },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: restaurant._id,
        name: restaurant.name,
        email: restaurant.email,
        slug: restaurant.slug,
        role: 'restaurant',
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Super Admin Login
// POST /api/auth/admin/login
router.post('/admin/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check against env credentials
    if (email !== process.env.SUPER_ADMIN_EMAIL) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Find or create super admin
    let admin = await Admin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    
    if (!admin) {
      // First time: create super admin from env
      const passwordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 12);
      admin = await Admin.create({
        email: process.env.SUPER_ADMIN_EMAIL,
        passwordHash,
        role: 'superadmin'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'superadmin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ message: 'Login successful', user: { email: admin.email, role: 'superadmin' } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Restaurant Login
// POST /api/auth/restaurant/login
router.post('/restaurant/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const restaurant = await Restaurant.findOne({ email, isDeleted: false });
    
    if (!restaurant) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({ message: 'Your restaurant account has been deactivated. Please contact the platform admin.' });
    }

    const isMatch = await restaurant.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: restaurant._id, restaurantId: restaurant._id.toString(), email: restaurant.email, role: 'restaurant', slug: restaurant.slug },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    res.json({
      message: 'Login successful',
      user: {
        id: restaurant._id,
        name: restaurant.name,
        email: restaurant.email,
        slug: restaurant.slug,
        role: 'restaurant'
      }
    });
  } catch (error) {
    console.error('Restaurant login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Logout (both admin and restaurant)
// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
});

// Get current user
// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'superadmin') {
      return res.json({ user: { email: decoded.email, role: 'superadmin' } });
    }

    if (decoded.role === 'restaurant') {
      const restaurant = await Restaurant.findById(decoded.restaurantId);
      if (!restaurant || restaurant.isDeleted || !restaurant.isActive) {
        return res.status(401).json({ message: 'Account not found or deactivated.' });
      }
      return res.json({
        user: {
          id: restaurant._id,
          name: restaurant.name,
          email: restaurant.email,
          slug: restaurant.slug,
          role: 'restaurant'
        }
      });
    }

    res.status(401).json({ message: 'Invalid session' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired session' });
  }
});

module.exports = router;
