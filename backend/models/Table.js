const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  tableNumber: {
    type: Number,
    required: true
  },
  tableName: {
    type: String,
    required: true,
    trim: true
  },
  qrToken: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index: unique table number per restaurant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ qrToken: 1 });

module.exports = mongoose.model('Table', tableSchema);
