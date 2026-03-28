const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  type: {
    type: String,
    enum: ['Salary', 'Payout', 'Bonus'],
    default: 'Payout'
  },
  referenceId: {
    type: String,
    default: ''
  },
  method: {
    type: String,
    enum: ['Bank', 'UPI'],
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
