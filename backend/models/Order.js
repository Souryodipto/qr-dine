const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  dietType: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan'],
    default: 'veg'
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  tableName: {
    type: String,
    default: ''
  },
  tableNumber: {
    type: Number
  },
  orderNumber: {
    type: Number
  },
  orderIdString: {
    type: String,
    unique: true,
    sparse: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  specialInstructions: {
    type: String,
    trim: true,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'mock', 'counter'],
    default: 'card'
  },
  orderStatus: {
    type: String,
    enum: ['new', 'preparing', 'ready', 'completed'],
    default: 'new'
  },
  receiptSent: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Auto-increment order number per restaurant and generate orderIdString
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // 1. Get Numeric CID from Restaurant
      const restaurant = await mongoose.model('Restaurant').findById(this.restaurantId, { numericId: 1 });
      const ncid = (restaurant && restaurant.numericId) ? restaurant.numericId.toString().padStart(3, '0') : '000';

      // 2. Get Date Prefix (YYMMDD)
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const datePrefix = `${year}${month}${day}`;

      // 3. Find Last Order for this restaurant TODAY to get increment
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      const lastOrderToday = await this.constructor.findOne(
        { 
          restaurantId: this.restaurantId,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        },
        { orderNumber: 1 },
        { sort: { createdAt: -1 } }
      );

      const sequence = lastOrderToday ? (lastOrderToday.orderNumber % 1000) + 1 : 1;
      this.orderNumber = sequence; // Storing sequence in orderNumber for legacy or internal use if needed

      // 4. Combine: YYMMDD + NCID + SEQ(3 digits)
      const seqStr = sequence.toString().padStart(3, '0');
      this.orderIdString = `${datePrefix}${ncid}${seqStr}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Indexes for efficient queries
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderStatus: 1 });
orderSchema.index({ paymentIntentId: 1 });

module.exports = mongoose.model('Order', orderSchema);
