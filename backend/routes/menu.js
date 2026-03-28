const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const authMiddleware = require('../middleware/authMiddleware');
const restaurantGuard = require('../middleware/restaurantGuard');
const { upload, uploadToCloudinary } = require('../services/cloudinaryService');

// All routes require restaurant auth
router.use(authMiddleware, restaurantGuard);

// ====== CATEGORIES ======

// GET /api/menu/categories — List categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ restaurantId: req.restaurantId })
      .sort({ displayOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories.' });
  }
});

// POST /api/menu/categories — Create category
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const maxOrder = await Category.findOne({ restaurantId: req.restaurantId }).sort({ displayOrder: -1 });
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

    const category = await Category.create({
      restaurantId: req.restaurantId,
      name,
      displayOrder
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category.' });
  }
});

// PUT /api/menu/categories/:id — Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { $set: req.body },
      { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category.' });
  }
});

// PUT /api/menu/categories/reorder — Reorder categories
router.put('/categories-reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body; // Array of category IDs in new order
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds array required.' });

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, restaurantId: req.restaurantId },
        update: { displayOrder: index }
      }
    }));

    await Category.bulkWrite(bulkOps);
    res.json({ message: 'Categories reordered.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reorder categories.' });
  }
});

// PATCH /api/menu/categories/:id/toggle — Toggle visibility
router.patch('/categories/:id/toggle', async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    category.isVisible = !category.isVisible;
    await category.save();
    res.json({ message: `Category ${category.isVisible ? 'visible' : 'hidden'}`, isVisible: category.isVisible });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle category.' });
  }
});

// DELETE /api/menu/categories/:id — Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const itemCount = await MenuItem.countDocuments({ categoryId: req.params.id, restaurantId: req.restaurantId });
    if (itemCount > 0) {
      return res.status(400).json({ message: `Cannot delete category with ${itemCount} items. Remove or reassign items first.` });
    }

    await Category.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    res.json({ message: 'Category deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category.' });
  }
});

// ====== MENU ITEMS ======

// GET /api/menu/items — List all items (optionally filter by category)
router.get('/items', async (req, res) => {
  try {
    const filter = { restaurantId: req.restaurantId };
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;

    const items = await MenuItem.find(filter).sort({ displayOrder: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch items.' });
  }
});

// POST /api/menu/items — Create menu item
router.post('/items', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, categoryId, dietType, isBestSeller, isChefSpecial } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: 'Name, price, and category are required.' });
    }

    // Verify category belongs to this restaurant
    const category = await Category.findOne({ _id: categoryId, restaurantId: req.restaurantId });
    if (!category) return res.status(400).json({ message: 'Invalid category.' });

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, req.restaurantId, 'menu');
    }

    const maxOrder = await MenuItem.findOne({ categoryId, restaurantId: req.restaurantId }).sort({ displayOrder: -1 });
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

    const item = await MenuItem.create({
      restaurantId: req.restaurantId,
      categoryId,
      name,
      description: description || '',
      price: parseFloat(price),
      imageUrl,
      dietType: dietType || 'veg',
      isBestSeller: isBestSeller === 'true' || isBestSeller === true,
      isChefSpecial: isChefSpecial === 'true' || isChefSpecial === true,
      displayOrder
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Failed to create menu item.' });
  }
});

// PUT /api/menu/items/:id — Update menu item
router.put('/items/:id', upload.single('image'), async (req, res) => {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!item) return res.status(404).json({ message: 'Menu item not found.' });

    const { name, description, price, categoryId, dietType, isBestSeller, isChefSpecial, isAvailable } = req.body;

    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (price) item.price = parseFloat(price);
    if (categoryId) item.categoryId = categoryId;
    if (dietType) item.dietType = dietType;
    if (isBestSeller !== undefined) item.isBestSeller = isBestSeller === 'true' || isBestSeller === true;
    if (isChefSpecial !== undefined) item.isChefSpecial = isChefSpecial === 'true' || isChefSpecial === true;
    if (isAvailable !== undefined) item.isAvailable = isAvailable === 'true' || isAvailable === true;

    if (req.file) {
      item.imageUrl = await uploadToCloudinary(req.file.buffer, req.restaurantId, 'menu');
    }

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update menu item.' });
  }
});

// PATCH /api/menu/items/:id/toggle — Toggle availability
router.patch('/items/:id/toggle', async (req, res) => {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!item) return res.status(404).json({ message: 'Menu item not found.' });

    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ message: `Item ${item.isAvailable ? 'available' : 'unavailable'}`, isAvailable: item.isAvailable });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle item.' });
  }
});

// PUT /api/menu/items-reorder — Reorder items within a category
router.put('/items-reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds array required.' });

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, restaurantId: req.restaurantId },
        update: { displayOrder: index }
      }
    }));

    await MenuItem.bulkWrite(bulkOps);
    res.json({ message: 'Items reordered.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reorder items.' });
  }
});

// DELETE /api/menu/items/:id — Delete menu item
router.delete('/items/:id', async (req, res) => {
  try {
    await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    res.json({ message: 'Item deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete item.' });
  }
});

module.exports = router;
