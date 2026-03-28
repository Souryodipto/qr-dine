const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'canceled', 'pending'],
    default: 'active'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'paid'
  },
  lastPaymentDate: {
    type: Date,
    default: Date.now
  },
  autoRenew: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient lookups
subscriptionSchema.index({ restaurantId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
