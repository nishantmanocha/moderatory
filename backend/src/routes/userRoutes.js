const express = require('express');
const { getDB } = require('../models/database');
const { asyncHandler } = require('../middleware/errorHandler');
const TransactionService = require('../services/transactionService');

const router = express.Router();

// POST /user/setup - User onboarding setup
router.post('/setup', asyncHandler(async (req, res) => {
  const { phone, name, monthly_income, monthly_rent, monthly_emi, savings_goal, language = 'en' } = req.body;
  
  if (!phone || !monthly_income) {
    return res.status(400).json({
      error: true,
      message: 'Phone and monthly income are required'
    });
  }

  const db = getDB();
  
  // Check if user already exists
  const existingUser = await new Promise((resolve) => {
    db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
      resolve(row);
    });
  });

  let userId;
  
  if (existingUser) {
    // Update existing user
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE users 
        SET name = ?, monthly_income = ?, monthly_rent = ?, monthly_emi = ?, 
            savings_goal = ?, language = ?, updated_at = CURRENT_TIMESTAMP
        WHERE phone = ?
      `, [name, monthly_income, monthly_rent || 0, monthly_emi || 0, savings_goal || 0, language, phone], 
      function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    userId = existingUser.id;
  } else {
    // Create new user
    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (phone, name, monthly_income, monthly_rent, monthly_emi, savings_goal, language)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [phone, name, monthly_income, monthly_rent || 0, monthly_emi || 0, savings_goal || 0, language],
      function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID });
      });
    });
    userId = result.lastID;
  }

  // Create default budget
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO budgets (user_id, essential_percentage, discretionary_percentage, savings_percentage)
      VALUES (?, 50.0, 30.0, 20.0)
    `, [userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Generate initial fake transactions
  const fakeTransactions = TransactionService.generateFakeTransactions(userId, 20);
  await TransactionService.saveTransactions(fakeTransactions);

  res.json({
    success: true,
    message: 'User setup completed successfully',
    user_id: userId,
    transactions_generated: fakeTransactions.length
  });
}));

// GET /user/:userId - Get user profile
router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = getDB();

  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    return res.status(404).json({
      error: true,
      message: 'User not found'
    });
  }

  // Get user's budget
  const budget = await new Promise((resolve) => {
    db.get('SELECT * FROM budgets WHERE user_id = ?', [userId], (err, row) => {
      resolve(row || {});
    });
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      monthly_income: user.monthly_income,
      monthly_rent: user.monthly_rent,
      monthly_emi: user.monthly_emi,
      savings_goal: user.savings_goal,
      language: user.language,
      created_at: user.created_at
    },
    budget
  });
}));

// GET /user - Get user by phone (for login)
router.get('/', asyncHandler(async (req, res) => {
  const { phone } = req.query;
  
  if (!phone) {
    return res.status(400).json({
      error: true,
      message: 'Phone number is required'
    });
  }

  const db = getDB();
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    return res.status(404).json({
      error: true,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      monthly_income: user.monthly_income,
      monthly_rent: user.monthly_rent,
      monthly_emi: user.monthly_emi,
      savings_goal: user.savings_goal,
      language: user.language,
      created_at: user.created_at
    }
  });
}));

module.exports = router;