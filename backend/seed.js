/**
 * Seed Script — Creates sample data for development
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Admin = require('./models/Admin');
const Restaurant = require('./models/Restaurant');
const Table = require('./models/Table');
const Category = require('./models/Category');
const MenuItem = require('./models/MenuItem');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Admin.deleteMany({}),
      Restaurant.deleteMany({}),
      Table.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create super admin
    const adminHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456', 12);
    await Admin.create({
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com',
      passwordHash: adminHash,
      role: 'superadmin'
    });
    console.log('✅ Super admin created');

    // Create sample restaurant
    const restPassword = 'Restaurant@123';
    const restHash = await bcrypt.hash(restPassword, 12);
    const restaurant = await Restaurant.create({
      slug: 'the-brew-house-' + uuidv4().split('-')[0],
      name: 'The Brew House',
      ownerName: 'Rahul Sharma',
      email: 'brewhouse@test.com',
      passwordHash: restHash,
      phone: '+91 9876543210',
      address: '123 MG Road, Koramangala',
      city: 'Bangalore',
      pincode: '560034',
      description: 'Artisan coffee & gourmet bites in a cozy atmosphere',
      cuisineTags: ['Cafe', 'Italian', 'Continental'],
      currency: 'INR',
      taxPercent: 5,
      brandColor: '#7C3AED',
      estimatedPrepTime: '15-25 minutes',
      customMessage: 'Thank you for choosing The Brew House! We hope you enjoy every sip and bite.',
      operatingHours: {
        monday: { open: '08:00', close: '23:00', isOpen: true },
        tuesday: { open: '08:00', close: '23:00', isOpen: true },
        wednesday: { open: '08:00', close: '23:00', isOpen: true },
        thursday: { open: '08:00', close: '23:00', isOpen: true },
        friday: { open: '08:00', close: '23:59', isOpen: true },
        saturday: { open: '09:00', close: '23:59', isOpen: true },
        sunday: { open: '09:00', close: '22:00', isOpen: true }
      }
    });
    console.log('✅ Restaurant created: The Brew House');
    console.log(`   Login: brewhouse@test.com / ${restPassword}`);

    // Create tables
    const tables = [];
    for (let i = 1; i <= 8; i++) {
      tables.push({
        restaurantId: restaurant._id,
        tableNumber: i,
        tableName: i <= 6 ? `Table ${i}` : (i === 7 ? 'Window Seat' : 'Terrace'),
        qrToken: uuidv4()
      });
    }
    await Table.insertMany(tables);
    console.log('✅ 8 tables created');

    // Create categories
    const cats = await Category.insertMany([
      { restaurantId: restaurant._id, name: 'Hot Beverages', displayOrder: 0 },
      { restaurantId: restaurant._id, name: 'Cold Beverages', displayOrder: 1 },
      { restaurantId: restaurant._id, name: 'Starters', displayOrder: 2 },
      { restaurantId: restaurant._id, name: 'Main Course', displayOrder: 3 },
      { restaurantId: restaurant._id, name: 'Desserts', displayOrder: 4 }
    ]);
    console.log('✅ 5 categories created');

    // Create menu items
    const items = [
      // Hot Beverages
      { categoryId: cats[0]._id, name: 'Cappuccino', description: 'Rich espresso with steamed milk foam', price: 180, dietType: 'veg', isBestSeller: true, displayOrder: 0 },
      { categoryId: cats[0]._id, name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 80, dietType: 'veg', displayOrder: 1 },
      { categoryId: cats[0]._id, name: 'Hot Chocolate', description: 'Belgian dark chocolate with whipped cream', price: 220, dietType: 'veg', displayOrder: 2 },
      { categoryId: cats[0]._id, name: 'Matcha Latte', description: 'Japanese matcha with oat milk', price: 250, dietType: 'vegan', isChefSpecial: true, displayOrder: 3 },
      // Cold Beverages
      { categoryId: cats[1]._id, name: 'Iced Americano', description: 'Double shot espresso over ice', price: 200, dietType: 'veg', displayOrder: 0 },
      { categoryId: cats[1]._id, name: 'Mango Smoothie', description: 'Fresh Alphonso mango blended with yogurt', price: 220, dietType: 'veg', isBestSeller: true, displayOrder: 1 },
      { categoryId: cats[1]._id, name: 'Cold Brew', description: '18-hour slow-steeped cold brew', price: 240, dietType: 'vegan', displayOrder: 2 },
      // Starters
      { categoryId: cats[2]._id, name: 'Garlic Bread', description: 'Crispy bread with garlic butter and herbs', price: 150, dietType: 'veg', displayOrder: 0 },
      { categoryId: cats[2]._id, name: 'Bruschetta', description: 'Toasted bread with tomato, basil, and olive oil', price: 180, dietType: 'vegan', displayOrder: 1 },
      { categoryId: cats[2]._id, name: 'Chicken Wings', description: 'Spicy BBQ glazed chicken wings', price: 320, dietType: 'non-veg', isBestSeller: true, displayOrder: 2 },
      { categoryId: cats[2]._id, name: 'Paneer Tikka', description: 'Tandoor-grilled cottage cheese with spices', price: 280, dietType: 'veg', isChefSpecial: true, displayOrder: 3 },
      // Main Course
      { categoryId: cats[3]._id, name: 'Margherita Pizza', description: 'Classic pizza with mozzarella, tomato sauce, and fresh basil', price: 350, dietType: 'veg', isBestSeller: true, displayOrder: 0 },
      { categoryId: cats[3]._id, name: 'Butter Chicken', description: 'Tender chicken in rich tomato-cream gravy', price: 380, dietType: 'non-veg', displayOrder: 1 },
      { categoryId: cats[3]._id, name: 'Pesto Pasta', description: 'Penne with house-made basil pesto and parmesan', price: 320, dietType: 'veg', isChefSpecial: true, displayOrder: 2 },
      { categoryId: cats[3]._id, name: 'Veggie Bowl', description: 'Quinoa bowl with roasted vegetables and tahini', price: 300, dietType: 'vegan', displayOrder: 3 },
      // Desserts
      { categoryId: cats[4]._id, name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', price: 280, dietType: 'veg', isBestSeller: true, displayOrder: 0 },
      { categoryId: cats[4]._id, name: 'Chocolate Brownie', description: 'Warm fudge brownie with vanilla ice cream', price: 250, dietType: 'veg', displayOrder: 1 },
      { categoryId: cats[4]._id, name: 'Fruit Sorbet', description: 'Mixed berry sorbet — dairy free', price: 180, dietType: 'vegan', displayOrder: 2 }
    ].map(item => ({ ...item, restaurantId: restaurant._id }));

    await MenuItem.insertMany(items);
    console.log('✅ 18 menu items created');

    console.log('\n🎉 Seed complete! You can now start the server.');
    console.log('\n📋 Credentials:');
    console.log(`   Super Admin: ${process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com'} / ${process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456'}`);
    console.log(`   Restaurant:  brewhouse@test.com / ${restPassword}`);
    console.log(`   Menu URL:    /menu/${restaurant.slug}?table=1`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
