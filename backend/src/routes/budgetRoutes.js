const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDB } = require('../models/database');

const router = express.Router();

// GET /budget/:userId - Get user's budget
router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = getDB();

  const budget = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM budgets WHERE user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!budget) {
    // Create default budget if none exists
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO budgets (user_id, essential_percentage, discretionary_percentage, savings_percentage)
        VALUES (?, 50.0, 30.0, 20.0)
      `, [userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get the newly created budget
    const newBudget = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM budgets WHERE user_id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    return res.json({
      success: true,
      budget: newBudget,
      message: 'Default budget created'
    });
  }

  res.json({
    success: true,
    budget
  });
}));

// PUT /budget/:userId - Update user's budget
router.put('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { essential_percentage, discretionary_percentage, savings_percentage, emergency_fund_target } = req.body;

  // Validate percentages
  if (essential_percentage !== undefined || discretionary_percentage !== undefined || savings_percentage !== undefined) {
    const total = (essential_percentage || 0) + (discretionary_percentage || 0) + (savings_percentage || 0);
    if (Math.abs(total - 100) > 0.1) { // Allow small floating point differences
      return res.status(400).json({
        error: true,
        message: 'Budget percentages must sum to 100%'
      });
    }
  }

  const db = getDB();

  // Build update query dynamically
  const updates = [];
  const values = [];

  if (essential_percentage !== undefined) {
    updates.push('essential_percentage = ?');
    values.push(essential_percentage);
  }
  if (discretionary_percentage !== undefined) {
    updates.push('discretionary_percentage = ?');
    values.push(discretionary_percentage);
  }
  if (savings_percentage !== undefined) {
    updates.push('savings_percentage = ?');
    values.push(savings_percentage);
  }
  if (emergency_fund_target !== undefined) {
    updates.push('emergency_fund_target = ?');
    values.push(emergency_fund_target);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      error: true,
      message: 'At least one field must be provided for update'
    });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const result = await new Promise((resolve, reject) => {
    db.run(`
      UPDATE budgets 
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `, values, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });

  if (result.changes === 0) {
    return res.status(404).json({
      error: true,
      message: 'Budget not found'
    });
  }

  // Get updated budget
  const updatedBudget = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM budgets WHERE user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    success: true,
    budget: updatedBudget,
    message: 'Budget updated successfully'
  });
}));

// GET /budget/:userId/analysis - Get budget vs actual spending analysis
router.get('/:userId/analysis', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days = 30 } = req.query;
  
  const db = getDB();
  
  // Get user's budget and income
  const userWithBudget = await new Promise((resolve, reject) => {
    db.get(`
      SELECT u.*, b.essential_percentage, b.discretionary_percentage, b.savings_percentage, b.emergency_fund_target
      FROM users u
      LEFT JOIN budgets b ON u.id = b.user_id
      WHERE u.id = ?
    `, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!userWithBudget) {
    return res.status(404).json({
      error: true,
      message: 'User not found'
    });
  }

  // Calculate budget amounts based on monthly income
  const monthlyIncome = userWithBudget.monthly_income || 0;
  const budgetAmounts = {
    essential: (monthlyIncome * (userWithBudget.essential_percentage || 50)) / 100,
    discretionary: (monthlyIncome * (userWithBudget.discretionary_percentage || 30)) / 100,
    savings: (monthlyIncome * (userWithBudget.savings_percentage || 20)) / 100
  };

  // Get actual spending for the period
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days));
  
  const actualSpending = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        category,
        SUM(ABS(amount)) as total_spent
      FROM transactions 
      WHERE user_id = ? AND date >= ? AND amount < 0
      GROUP BY category
    `, [userId, daysAgo.toISOString().split('T')[0]], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get actual savings (income - expenses)
  const incomeVsExpenses = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses
      FROM transactions 
      WHERE user_id = ? AND date >= ?
    `, [userId, daysAgo.toISOString().split('T')[0]], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  const actualSavings = (incomeVsExpenses.total_income || 0) - (incomeVsExpenses.total_expenses || 0);

  // Build analysis
  const analysis = {
    period_days: parseInt(days),
    monthly_income: monthlyIncome,
    budget_allocations: budgetAmounts,
    actual_spending: {},
    variance: {},
    performance: {}
  };

  // Process actual spending by category
  actualSpending.forEach(spending => {
    const category = spending.category.toLowerCase();
    analysis.actual_spending[category] = spending.total_spent;
    
    if (budgetAmounts[category]) {
      const periodBudget = budgetAmounts[category] * (parseInt(days) / 30); // Prorate for period
      analysis.variance[category] = {
        budgeted: periodBudget,
        actual: spending.total_spent,
        difference: periodBudget - spending.total_spent,
        percentage: (spending.total_spent / periodBudget * 100).toFixed(1)
      };
      
      analysis.performance[category] = spending.total_spent <= periodBudget ? 'on_track' : 'over_budget';
    }
  });

  // Add savings analysis
  const periodSavingsBudget = budgetAmounts.savings * (parseInt(days) / 30);
  analysis.variance.savings = {
    budgeted: periodSavingsBudget,
    actual: actualSavings,
    difference: actualSavings - periodSavingsBudget,
    percentage: actualSavings > 0 ? (actualSavings / periodSavingsBudget * 100).toFixed(1) : '0.0'
  };
  analysis.performance.savings = actualSavings >= periodSavingsBudget ? 'on_track' : 'below_target';

  res.json({
    success: true,
    analysis
  });
}));

module.exports = router;