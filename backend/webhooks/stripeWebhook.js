const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { verifyWebhookSignature } = require('../services/paymentService');
const { emitNewOrder } = require('../services/socketService');
const { sendReceiptEmail } = require('../services/emailService');

// POST /api/webhooks/stripe — Stripe webhook
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = verifyWebhookSignature(req.body, sig);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentMethod = paymentIntent.payment_method_types?.[0] || 'card';
        await order.save();

        const restaurant = await Restaurant.findById(order.restaurantId);
        
        // Emit to restaurant dashboard
        emitNewOrder(order.restaurantId.toString(), order);
        
        // Send receipt email
        sendReceiptEmail(order, restaurant).then(result => {
          if (result.success) {
            Order.findByIdAndUpdate(order._id, { receiptSent: true }).exec();
          }
        });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await Order.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { paymentStatus: 'failed' }
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ message: 'Webhook error' });
  }
});

module.exports = router;
