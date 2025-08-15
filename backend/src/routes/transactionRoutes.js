const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const TransactionService = require('../services/transactionService');

const router = express.Router();

// GET /transactions/:userId - Get all transactions for user
router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 100 } = req.query;

  const transactions = await TransactionService.getUserTransactions(userId, parseInt(limit));
  
  if (transactions.length === 0) {
    // Generate fake transactions if none exist
    const fakeTransactions = TransactionService.generateFakeTransactions(userId, 25);
    await TransactionService.saveTransactions(fakeTransactions);
    const newTransactions = await TransactionService.getUserTransactions(userId, parseInt(limit));
    
    return res.json({
      success: true,
      transactions: newTransactions,
      generated: true,
      message: 'Generated sample transactions for demo'
    });
  }

  res.json({
    success: true,
    transactions,
    generated: false
  });
}));

// GET /transactions/:userId/week - Get weekly transaction summary
router.get('/:userId/week', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const weeklyData = await TransactionService.getWeeklyTransactions(userId);
  
  res.json({
    success: true,
    weekly_data: weeklyData,
    summary: {
      total_days: weeklyData.length,
      total_income: weeklyData.reduce((sum, day) => sum + day.income, 0),
      total_expenses: weeklyData.reduce((sum, day) => sum + day.expenses, 0),
      total_savings: weeklyData.reduce((sum, day) => sum + day.net_savings, 0)
    }
  });
}));

// POST /transactions/add - Add new transaction
router.post('/add', asyncHandler(async (req, res) => {
  const { user_id, amount, category, merchant, description, date } = req.body;
  
  if (!user_id || amount === undefined || !category) {
    return res.status(400).json({
      error: true,
      message: 'user_id, amount, and category are required'
    });
  }

  if (!['Income', 'Essential', 'Discretionary', 'Debt'].includes(category)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid category. Must be Income, Essential, Discretionary, or Debt'
    });
  }

  const transaction = await TransactionService.addTransaction({
    user_id,
    amount: parseFloat(amount),
    category,
    merchant: merchant || 'Manual Entry',
    description: description || 'Manual transaction',
    date
  });

  res.json({
    success: true,
    transaction,
    message: 'Transaction added successfully'
  });
}));

// PUT /transactions/:transactionId - Update transaction category
router.put('/:transactionId', asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { category } = req.body;
  
  if (!category) {
    return res.status(400).json({
      error: true,
      message: 'Category is required'
    });
  }

  if (!['Income', 'Essential', 'Discretionary', 'Debt'].includes(category)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid category. Must be Income, Essential, Discretionary, or Debt'
    });
  }

  const result = await TransactionService.updateTransactionCategory(transactionId, category);
  
  if (result.changes === 0) {
    return res.status(404).json({
      error: true,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    message: 'Transaction category updated successfully'
  });
}));

// POST /transactions/:userId/generate-fresh - Generate new fake transactions
router.post('/:userId/generate-fresh', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { count = 25 } = req.body;
  
  const fakeTransactions = TransactionService.generateFakeTransactions(userId, count);
  await TransactionService.saveTransactions(fakeTransactions);
  
  res.json({
    success: true,
    message: `Generated ${fakeTransactions.length} new transactions`,
    transactions_generated: fakeTransactions.length
  });
}));

module.exports = router;