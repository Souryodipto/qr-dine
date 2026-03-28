const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

// POST /api/session/create
// Creates a global customer session based on phone number
router.post('/create', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone number are required.' });
    }

    // Guest session logic: Do not create a permanent Customer document
    // Just generate a temporary ID if needed, or use a specific format
    const tempId = new (require('mongoose')).Types.ObjectId();

    // Use environment secret or fallback for dev
    const secret = process.env.JWT_SECRET || 'super_secret_dev_key_123';
    const token = jwt.sign(
      { id: tempId, name, phone, role: 'customer', isGuest: true },
      secret,
      { expiresIn: '12h' } // Shorter expiry for guest session
    );

    // Set HTTP-only cookie for secure browser sessions
    res.cookie('customerToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Also return token in body
    res.json({
      message: 'Guest session created successfully',
      user: {
        id: tempId,
        name,
        phone,
        email: email || '',
        role: 'customer',
        isGuest: true
      },
      token,
      sessionId: token
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ message: 'Server error during session creation.' });
  }
});

module.exports = router;
