const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for ordering categories per restaurant
categorySchema.index({ restaurantId: 1, displayOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
