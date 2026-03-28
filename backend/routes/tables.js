const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Table = require('../models/Table');
const authMiddleware = require('../middleware/authMiddleware');
const restaurantGuard = require('../middleware/restaurantGuard');

// All routes require restaurant auth
router.use(authMiddleware, restaurantGuard);

// GET /api/tables — List all tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find({ restaurantId: req.restaurantId }).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tables.' });
  }
});

// POST /api/tables — Create single table
router.post('/', async (req, res) => {
  try {
    const { tableName, tableNumber } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: 'Table number is required.' });
    }

    // Check if table number already exists
    const existing = await Table.findOne({ restaurantId: req.restaurantId, tableNumber });
    if (existing) {
      return res.status(400).json({ message: `Table ${tableNumber} already exists.` });
    }

    const table = await Table.create({
      restaurantId: req.restaurantId,
      tableNumber,
      tableName: tableName || `Table ${tableNumber}`,
      qrToken: uuidv4()
    });

    res.status(201).json(table);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Failed to create table.' });
  }
});

// POST /api/tables/bulk — Create multiple tables at once
router.post('/bulk', async (req, res) => {
  try {
    const { count, startFrom = 1, prefix = 'Table' } = req.body;

    if (!count || count < 1 || count > 100) {
      return res.status(400).json({ message: 'Count must be between 1 and 100.' });
    }

    const tables = [];
    const existingNumbers = await Table.find({ restaurantId: req.restaurantId }).distinct('tableNumber');
    const existingSet = new Set(existingNumbers);

    let num = startFrom;
    let created = 0;
    while (created < count) {
      if (!existingSet.has(num)) {
        tables.push({
          restaurantId: req.restaurantId,
          tableNumber: num,
          tableName: `${prefix} ${num}`,
          qrToken: uuidv4()
        });
        created++;
      }
      num++;
    }

    const result = await Table.insertMany(tables);
    res.status(201).json({ message: `${result.length} tables created`, tables: result });
  } catch (error) {
    console.error('Bulk create tables error:', error);
    res.status(500).json({ message: 'Failed to create tables.' });
  }
});

// PUT /api/tables/:id — Update table name
router.put('/:id', async (req, res) => {
  try {
    const { tableName } = req.body;
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { tableName },
      { new: true }
    );
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update table.' });
  }
});

// PATCH /api/tables/:id/toggle — Toggle table active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const table = await Table.findOne({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!table) return res.status(404).json({ message: 'Table not found.' });

    table.isActive = !table.isActive;
    await table.save();
    res.json({ message: `Table ${table.isActive ? 'activated' : 'deactivated'}`, isActive: table.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle table.' });
  }
});

// PATCH /api/tables/deactivate-all — Deactivate all tables
router.patch('/deactivate-all', async (req, res) => {
  try {
    await Table.updateMany({ restaurantId: req.restaurantId }, { isActive: false });
    res.json({ message: 'All tables deactivated.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate all tables.' });
  }
});

// PATCH /api/tables/activate-all — Activate all tables
router.patch('/activate-all', async (req, res) => {
  try {
    await Table.updateMany({ restaurantId: req.restaurantId }, { isActive: true });
    res.json({ message: 'All tables activated.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to activate all tables.' });
  }
});

// PATCH /api/tables/:id/regenerate-qr — Regenerate QR token
router.patch('/:id/regenerate-qr', async (req, res) => {
  try {
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { qrToken: uuidv4() },
      { new: true }
    );
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    res.json({ message: 'QR code regenerated. Previous QR will no longer work.', table });
  } catch (error) {
    res.status(500).json({ message: 'Failed to regenerate QR.' });
  }
});

// PATCH /api/tables/regenerate-all-qr — Regenerate all QR tokens
router.patch('/regenerate-all-qr', async (req, res) => {
  try {
    const tables = await Table.find({ restaurantId: req.restaurantId });
    for (const table of tables) {
      table.qrToken = uuidv4();
      await table.save();
    }
    res.json({ message: 'All QR codes regenerated. All previous QRs will no longer work.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to regenerate all QRs.' });
  }
});

// DELETE /api/tables/all — Bulk delete all tables
router.delete('/all', async (req, res) => {
  try {
    const result = await Table.deleteMany({ restaurantId: req.restaurantId });
    res.json({ message: `${result.deletedCount} tables removed from terminal.`, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Failed to clear tables.' });
  }
});

// DELETE /api/tables/:id — Delete table
router.delete('/:id', async (req, res) => {
  try {
    await Table.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    res.json({ message: 'Table deleted. Its QR code is now invalid.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete table.' });
  }
});

module.exports = router;
