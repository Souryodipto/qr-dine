const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const operatingHourSchema = new mongoose.Schema({
  open: { type: String, default: '09:00' },
  close: { type: String, default: '22:00' },
  isOpen: { type: Boolean, default: true }
}, { _id: false });

const restaurantSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  numericId: {
    type: Number,
    unique: true,
    sparse: true
  },
  currentSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  pincode: {
    type: String,
    trim: true,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  cuisineTags: [{
    type: String,
    trim: true
  }],
  operatingHours: {
    monday: { type: operatingHourSchema, default: () => ({}) },
    tuesday: { type: operatingHourSchema, default: () => ({}) },
    wednesday: { type: operatingHourSchema, default: () => ({}) },
    thursday: { type: operatingHourSchema, default: () => ({}) },
    friday: { type: operatingHourSchema, default: () => ({}) },
    saturday: { type: operatingHourSchema, default: () => ({}) },
    sunday: { type: operatingHourSchema, default: () => ({}) }
  },
  estimatedPrepTime: {
    type: String,
    default: '20-30 minutes'
  },
  customMessage: {
    type: String,
    default: 'Thank you for dining with us! We hope you enjoy your meal.'
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP'],
    default: 'INR'
  },
  paymentInfo: {
    method: { type: String, enum: ['upi', 'bank', 'cash'], default: 'cash' },
    upiId: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branchName: { type: String, default: '' }
  },
  brandColor: {
    type: String,
    default: '#E11D48'
  },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    mapUrl: { type: String, default: '' }
  },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  stripeAccountId: {
    type: String,
    default: ''
  },
  bankConnected: {
    type: Boolean,
    default: false
  },
  platformFeePercent: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAcceptingOrders: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compare password method
restaurantSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if restaurant is currently open based on operating hours
restaurantSchema.methods.isCurrentlyOpen = function () {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const hours = this.operatingHours[today];

  if (!hours || !hours.isOpen) return false;

  const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0');
  return currentTime >= hours.open && currentTime <= hours.close;
};

// Never return password hash
restaurantSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Index for efficient queries
restaurantSchema.index({ slug: 1 });
restaurantSchema.index({ email: 1 });
restaurantSchema.index({ isActive: 1, isDeleted: 1 });
restaurantSchema.index({ numericId: 1 });

// Pre-save hook to assign numericId
restaurantSchema.pre('save', async function (next) {
  if (this.isNew && !this.numericId) {
    try {
      const lastRestaurant = await this.constructor.findOne({}, { numericId: 1 }, { sort: { numericId: -1 } });
      this.numericId = (lastRestaurant && lastRestaurant.numericId) ? lastRestaurant.numericId + 1 : 101;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
