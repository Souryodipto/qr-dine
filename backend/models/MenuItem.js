const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  dietType: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan'],
    default: 'veg'
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isChefSpecial: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for fetching menu by restaurant and category
menuItemSchema.index({ restaurantId: 1, categoryId: 1, displayOrder: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
