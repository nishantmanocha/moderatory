const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDB } = require('../models/database');
const MLService = require('../services/mlService');
const TransactionService = require('../services/transactionService');

const router = express.Router();

// GET /analytics/:userId/safe-save - Get AI safe save recommendation
router.get('/:userId/safe-save', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = getDB();

  // Get user data
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

  // Get recent transactions (last 7 days)
  const recentTransactions = await TransactionService.getUserTransactions(userId, 50);
  const last7Days = recentTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return transactionDate >= sevenDaysAgo;
  });

  // Get AI recommendation
  const recommendation = await MLService.getSafeSaveRecommendation(user, last7Days);

  res.json({
    success: true,
    recommendation,
    user_context: {
      monthly_income: user.monthly_income,
      monthly_expenses: user.monthly_rent + user.monthly_emi,
      recent_transactions_count: last7Days.length
    }
  });
}));

// GET /analytics/:userId/projection - Get savings goal projection
router.get('/:userId/projection', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = getDB();

  // Get user data
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

  // Get transaction history
  const transactionHistory = await TransactionService.getUserTransactions(userId, 200);

  // Get AI projection
  const projection = await MLService.getGoalProjection(user, transactionHistory);

  res.json({
    success: true,
    projection,
    user_context: {
      savings_goal: user.savings_goal,
      transaction_history_count: transactionHistory.length
    }
  });
}));

// POST /analytics/categorize-merchant - Categorize merchant using AI
router.post('/categorize-merchant', asyncHandler(async (req, res) => {
  const { merchant, description } = req.body;

  if (!merchant) {
    return res.status(400).json({
      error: true,
      message: 'Merchant name is required'
    });
  }

  // Get AI categorization
  const categorization = await MLService.categorizeMerchant({
    merchant,
    description: description || ''
  });

  res.json({
    success: true,
    categorization
  });
}));

// GET /analytics/:userId/spending-insights - Get spending pattern insights
router.get('/:userId/spending-insights', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days = 30 } = req.query;
  
  const db = getDB();
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days));
  
  // Get spending breakdown by category
  const spendingByCategory = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        category,
        COUNT(*) as transaction_count,
        SUM(ABS(amount)) as total_amount,
        AVG(ABS(amount)) as avg_amount,
        MIN(date) as first_transaction,
        MAX(date) as last_transaction
      FROM transactions 
      WHERE user_id = ? AND date >= ? AND amount < 0
      GROUP BY category
      ORDER BY total_amount DESC
    `, [userId, daysAgo.toISOString().split('T')[0]], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get top merchants
  const topMerchants = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        merchant,
        category,
        COUNT(*) as transaction_count,
        SUM(ABS(amount)) as total_spent,
        AVG(ABS(amount)) as avg_transaction
      FROM transactions 
      WHERE user_id = ? AND date >= ? AND amount < 0
      GROUP BY merchant, category
      ORDER BY total_spent DESC
      LIMIT 10
    `, [userId, daysAgo.toISOString().split('T')[0]], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Calculate insights
  const totalSpent = spendingByCategory.reduce((sum, cat) => sum + cat.total_amount, 0);
  const insights = {
    period_days: parseInt(days),
    total_spent: totalSpent,
    daily_average: totalSpent / parseInt(days),
    category_breakdown: spendingByCategory.map(cat => ({
      ...cat,
      percentage: ((cat.total_amount / totalSpent) * 100).toFixed(1)
    })),
    top_merchants: topMerchants,
    recommendations: []
  };

  // Add basic recommendations
  if (spendingByCategory.length > 0) {
    const topCategory = spendingByCategory[0];
    if (topCategory.category === 'Discretionary' && topCategory.total_amount > totalSpent * 0.4) {
      insights.recommendations.push({
        type: 'reduce_discretionary',
        message: `You're spending ${((topCategory.total_amount / totalSpent) * 100).toFixed(0)}% on discretionary items. Consider reducing by 10% to boost savings.`,
        potential_savings: topCategory.total_amount * 0.1
      });
    }
  }

  res.json({
    success: true,
    insights
  });
}));

module.exports = router;