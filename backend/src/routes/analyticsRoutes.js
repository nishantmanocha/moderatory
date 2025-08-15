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

// GET /analytics/:userId/investment-recommendations - Get personalized investment recommendations
router.get('/:userId/investment-recommendations', asyncHandler(async (req, res) => {
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

  // Get recent transactions for spending analysis
  const recentTransactions = await TransactionService.getUserTransactions(userId, 100);
  
  // Calculate disposable income
  const monthlyExpenses = user.monthly_rent + user.monthly_emi;
  const disposableIncome = user.monthly_income - monthlyExpenses;
  
  // Age-based risk profile
  const age = user.age || 25;
  const riskTolerance = age < 30 ? 'aggressive' : age < 45 ? 'moderate' : 'conservative';
  
  // Calculate recommended allocation
  const recommendations = calculateInvestmentRecommendations(disposableIncome, age, riskTolerance, user.savings_goal);
  
  // Generate growth projections
  const projections = generateGrowthProjections(recommendations.totalInvestment, recommendations.allocation, age);

  res.json({
    success: true,
    recommendations,
    projections,
    user_profile: {
      age,
      disposable_income: disposableIncome,
      risk_tolerance: riskTolerance,
      savings_goal: user.savings_goal
    }
  });
}));

// GET /analytics/:userId/portfolio-allocation - Get optimal portfolio allocation
router.get('/:userId/portfolio-allocation', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { investmentAmount } = req.query;
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

  const age = user.age || 25;
  const amount = parseFloat(investmentAmount) || 1000;
  
  const allocation = calculatePortfolioAllocation(age, amount);
  
  res.json({
    success: true,
    allocation,
    total_amount: amount,
    age_group: age < 30 ? 'young' : age < 45 ? 'middle' : 'mature'
  });
}));

// GET /analytics/:userId/investment-comparison - Compare investment options
router.get('/:userId/investment-comparison', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { amount = 1000, years = 5 } = req.query;

  const investmentAmount = parseFloat(amount);
  const timeHorizon = parseInt(years);
  
  const comparison = {
    bank_savings: {
      name: 'Bank Savings',
      annual_return: 3.5,
      final_amount: calculateCompoundInterest(investmentAmount, 3.5, timeHorizon),
      risk_level: 'Very Low',
      liquidity: 'High',
      tax_benefit: false
    },
    ppf: {
      name: 'Public Provident Fund (PPF)',
      annual_return: 7.1,
      final_amount: calculateCompoundInterest(investmentAmount, 7.1, timeHorizon),
      risk_level: 'Low',
      liquidity: 'Low (15 years lock-in)',
      tax_benefit: true,
      max_investment: 150000
    },
    elss: {
      name: 'ELSS Mutual Funds',
      annual_return: 12.0,
      final_amount: calculateCompoundInterest(investmentAmount, 12.0, timeHorizon),
      risk_level: 'Medium to High',
      liquidity: 'Medium (3 years lock-in)',
      tax_benefit: true,
      max_investment: 150000
    },
    nps: {
      name: 'National Pension System (NPS)',
      annual_return: 10.0,
      final_amount: calculateCompoundInterest(investmentAmount, 10.0, timeHorizon),
      risk_level: 'Medium',
      liquidity: 'Very Low (till 60 years)',
      tax_benefit: true,
      max_investment: 200000
    },
    gold_etf: {
      name: 'Gold ETF',
      annual_return: 8.0,
      final_amount: calculateCompoundInterest(investmentAmount, 8.0, timeHorizon),
      risk_level: 'Medium',
      liquidity: 'High',
      tax_benefit: false
    }
  };

  res.json({
    success: true,
    comparison,
    investment_amount: investmentAmount,
    time_horizon: timeHorizon,
    best_option: findBestInvestmentOption(comparison, timeHorizon)
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

// Helper functions
function calculateInvestmentRecommendations(disposableIncome, age, riskTolerance, savingsGoal) {
  const recommendedSavingsRate = Math.min(0.3, Math.max(0.1, disposableIncome / 10000 * 0.1));
  const totalInvestment = disposableIncome * recommendedSavingsRate;
  
  let allocation = {};
  
  if (riskTolerance === 'aggressive') {
    allocation = {
      emergency_fund: { percentage: 20, amount: totalInvestment * 0.2, scheme: 'Bank Savings' },
      elss: { percentage: 40, amount: totalInvestment * 0.4, scheme: 'ELSS Mutual Funds' },
      ppf: { percentage: 25, amount: totalInvestment * 0.25, scheme: 'PPF' },
      gold_etf: { percentage: 15, amount: totalInvestment * 0.15, scheme: 'Gold ETF' }
    };
  } else if (riskTolerance === 'moderate') {
    allocation = {
      emergency_fund: { percentage: 25, amount: totalInvestment * 0.25, scheme: 'Bank Savings' },
      ppf: { percentage: 35, amount: totalInvestment * 0.35, scheme: 'PPF' },
      elss: { percentage: 25, amount: totalInvestment * 0.25, scheme: 'ELSS Mutual Funds' },
      nps: { percentage: 15, amount: totalInvestment * 0.15, scheme: 'NPS' }
    };
  } else {
    allocation = {
      emergency_fund: { percentage: 30, amount: totalInvestment * 0.3, scheme: 'Bank Savings' },
      ppf: { percentage: 50, amount: totalInvestment * 0.5, scheme: 'PPF' },
      nps: { percentage: 20, amount: totalInvestment * 0.2, scheme: 'NPS' }
    };
  }

  return {
    totalInvestment,
    allocation,
    risk_profile: riskTolerance,
    emergency_fund_target: disposableIncome * 6,
    tax_saving_schemes: ['PPF', 'ELSS', 'NPS']
  };
}

function calculatePortfolioAllocation(age, amount) {
  const equityPercentage = Math.max(20, Math.min(80, 100 - age));
  const debtPercentage = 100 - equityPercentage;
  
  return {
    equity: {
      percentage: equityPercentage,
      amount: amount * (equityPercentage / 100),
      instruments: ['ELSS', 'Large Cap Funds', 'Mid Cap Funds']
    },
    debt: {
      percentage: debtPercentage,
      amount: amount * (debtPercentage / 100),
      instruments: ['PPF', 'Corporate Bonds', 'Bank FD']
    },
    gold: {
      percentage: 10,
      amount: amount * 0.1,
      instruments: ['Gold ETF', 'Gold Bonds']
    }
  };
}

function generateGrowthProjections(investmentAmount, allocation, age) {
  const years = [1, 3, 5, 10, 15, 20];
  const projections = {};
  
  years.forEach(year => {
    let totalValue = 0;
    
    Object.keys(allocation).forEach(scheme => {
      const schemeAmount = allocation[scheme].amount;
      let rate = 0;
      
      switch (scheme) {
        case 'emergency_fund': rate = 3.5; break;
        case 'ppf': rate = 7.1; break;
        case 'elss': rate = 12.0; break;
        case 'nps': rate = 10.0; break;
        case 'gold_etf': rate = 8.0; break;
        default: rate = 6.0;
      }
      
      totalValue += calculateCompoundInterest(schemeAmount, rate, year);
    });
    
    projections[`year_${year}`] = {
      total_value: Math.round(totalValue),
      investment_amount: investmentAmount * year * 12,
      returns: Math.round(totalValue - (investmentAmount * year * 12))
    };
  });
  
  return projections;
}

function calculateCompoundInterest(principal, rate, years) {
  return principal * Math.pow(1 + rate / 100, years);
}

function findBestInvestmentOption(comparison, timeHorizon) {
  let bestOption = null;
  let highestReturn = 0;
  
  Object.keys(comparison).forEach(key => {
    const option = comparison[key];
    if (option.final_amount > highestReturn) {
      highestReturn = option.final_amount;
      bestOption = {
        name: option.name,
        final_amount: option.final_amount,
        annual_return: option.annual_return
      };
    }
  });
  
  return bestOption;
}

module.exports = router;