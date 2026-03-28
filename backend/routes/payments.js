const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { createPaymentIntent } = require('../services/paymentService');
const { emitNewOrder } = require('../services/socketService');
const { sendReceiptEmail } = require('../services/emailService');

// POST /api/payments/create-intent — Create payment intent (public, no auth)
router.post('/create-intent', async (req, res) => {
  try {
    const { restaurantId, items, customerName, customerEmail, customerPhone, sessionId, tableId, tableName, tableNumber, specialInstructions, customerId } = req.body;

    if (!restaurantId || !items || !items.length || !customerName || !customerEmail) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive || restaurant.isDeleted) {
      return res.status(404).json({ message: 'Restaurant not available.' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = Math.round(subtotal * (restaurant.taxPercent / 100) * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    // Amount in smallest currency unit (paise for INR, cents for USD)
    const amountInSmallestUnit = Math.round(totalAmount * 100);

    const paymentIntent = await createPaymentIntent({
      amount: amountInSmallestUnit,
      currency: restaurant.currency,
      restaurantStripeAccountId: restaurant.stripeAccountId,
      platformFeePercent: restaurant.platformFeePercent,
      metadata: { restaurantId: restaurantId.toString(), customerEmail }
    });

    // Create pending order
    const order = await Order.create({
      restaurantId,
      customerId,
      sessionId,
      tableId,
      tableName: tableName || `Table ${tableNumber}`,
      tableNumber,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      items,
      subtotal,
      taxAmount,
      totalAmount,
      specialInstructions: specialInstructions || '',
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'pending'
    });

    // If mock payment (dev mode), auto-complete
    if (paymentIntent.mock) {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'mock';
      await order.save();

      // Emit to restaurant
      emitNewOrder(restaurantId, order);

      // Send receipt
      sendReceiptEmail(order, restaurant).then(result => {
        if (result.success) {
          Order.findByIdAndUpdate(order._id, { receiptSent: true }).exec();
        }
      });

      return res.json({
        success: true,
        mock: true,
        order: order,
        message: 'Order placed successfully (dev mode — payment simulated)'
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order._id,
      totalAmount
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment.' });
  }
});

// POST /api/payments/confirm-mock — Confirm mock payment (dev mode)
router.post('/confirm-mock', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.paymentStatus = 'paid';
    order.paymentMethod = 'mock';
    await order.save();

    const restaurant = await Restaurant.findById(order.restaurantId);
    emitNewOrder(order.restaurantId.toString(), order);

    sendReceiptEmail(order, restaurant).then(result => {
      if (result.success) {
        Order.findByIdAndUpdate(order._id, { receiptSent: true }).exec();
      }
    });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm payment.' });
  }
});

module.exports = router;
