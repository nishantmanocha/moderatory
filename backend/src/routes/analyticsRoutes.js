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

// GET /analytics/:userId/goal-planning - Comprehensive goal planning with savings vs investing
router.get('/:userId/goal-planning', asyncHandler(async (req, res) => {
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

  // Calculate disposable income
  const monthlyIncome = user.monthly_income || 30000;
  const monthlyExpenses = (user.monthly_rent || 8000) + (user.monthly_emi || 0);
  const disposableIncome = monthlyIncome - monthlyExpenses;
  const savingsGoal = user.savings_goal || 500000;
  const age = user.age || 25;

  // Calculate realistic savings rate (20-40% of disposable income)
  const recommendedSavingsRate = Math.min(0.4, Math.max(0.2, disposableIncome / 20000 * 0.3));
  const monthlySavingsCapacity = Math.floor(disposableIncome * recommendedSavingsRate);
  const dailySavingsCapacity = Math.floor(monthlySavingsCapacity / 30);

  // Savings-Only Plan
  const savingsOnlyPlan = calculateSavingsOnlyPlan(savingsGoal, monthlySavingsCapacity);
  
  // Savings + Investing Plan
  const investingPlan = calculateSavingsInvestingPlan(savingsGoal, disposableIncome, age);
  
  // Tax optimization calculations
  const taxOptimization = calculateTaxOptimization(monthlyIncome, investingPlan.monthlyInvestment);
  
  // Timeline comparison data for graphs
  const timelineComparison = generateTimelineComparison(
    savingsOnlyPlan.monthlyAmount,
    investingPlan.monthlyInvestment,
    investingPlan.expectedReturn,
    savingsGoal
  );

  // Calculate time saved by investing
  const timeSaved = savingsOnlyPlan.months - investingPlan.months;
  const yearsSaved = Math.floor(timeSaved / 12);
  const monthsSaved = timeSaved % 12;

  // Recommended first step
  const recommendedFirstStep = getRecommendedFirstStep(disposableIncome, age, savingsGoal);

  res.json({
    success: true,
    goal_planning: {
      user_profile: {
        monthly_income: monthlyIncome,
        monthly_expenses: monthlyExpenses,
        disposable_income: disposableIncome,
        savings_goal: savingsGoal,
        age: age
      },
      savings_capacity: {
        recommended_rate: `${Math.round(recommendedSavingsRate * 100)}%`,
        monthly_capacity: monthlySavingsCapacity,
        daily_capacity: dailySavingsCapacity
      },
      savings_only_plan: savingsOnlyPlan,
      savings_investing_plan: investingPlan,
      tax_optimization: taxOptimization,
      timeline_comparison: timelineComparison,
      time_saved: {
        total_months: timeSaved,
        years: yearsSaved,
        months: monthsSaved,
        percentage_faster: Math.round((timeSaved / savingsOnlyPlan.months) * 100)
      },
      recommended_first_step: recommendedFirstStep,
      summary: generateFriendlySummary(timeSaved, investingPlan, recommendedFirstStep)
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

// Helper functions for goal planning
function calculateSavingsOnlyPlan(goal, monthlyCapacity) {
  const months = Math.ceil(goal / monthlyCapacity);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  // Generate monthly progression
  const progression = [];
  for (let month = 1; month <= Math.min(months, 60); month++) {
    progression.push({
      month: month,
      amount_saved: monthlyCapacity * month,
      cumulative_total: monthlyCapacity * month
    });
  }

  return {
    monthly_amount: monthlyCapacity,
    daily_amount: Math.floor(monthlyCapacity / 30),
    months: months,
    years: years,
    remaining_months: remainingMonths,
    achievable: months <= 120, // Achievable within 10 years
    progression: progression
  };
}

function calculateSavingsInvestingPlan(goal, disposableIncome, age) {
  // Age-based risk allocation
  const riskProfile = age < 30 ? 'aggressive' : age < 45 ? 'moderate' : 'conservative';
  
  // Split between savings and investments (more aggressive = more investing)
  let savingsRatio, investmentRatio, expectedReturn;
  
  if (riskProfile === 'aggressive') {
    savingsRatio = 0.3;
    investmentRatio = 0.7;
    expectedReturn = 12; // Higher equity allocation
  } else if (riskProfile === 'moderate') {
    savingsRatio = 0.4;
    investmentRatio = 0.6;
    expectedReturn = 10; // Balanced portfolio
  } else {
    savingsRatio = 0.6;
    investmentRatio = 0.4;
    expectedReturn = 8; // Conservative debt-heavy portfolio
  }

  const monthlyCapacity = Math.min(disposableIncome * 0.4, disposableIncome - 5000); // Leave some buffer
  const monthlySavings = Math.floor(monthlyCapacity * savingsRatio);
  const monthlyInvestment = Math.floor(monthlyCapacity * investmentRatio);
  
  // Calculate time to reach goal with compound interest
  const months = calculateCompoundGrowthTime(goal, monthlySavings, monthlyInvestment, expectedReturn);
  
  // Investment options with realistic returns
  const investmentOptions = getInvestmentOptions(monthlyInvestment, riskProfile);
  
  // Generate progression with compounding
  const progression = [];
  let savingsTotal = 0;
  let investmentTotal = 0;
  
  for (let month = 1; month <= Math.min(months, 60); month++) {
    savingsTotal += monthlySavings;
    
    // Compound growth for investments
    if (month === 1) {
      investmentTotal = monthlyInvestment;
    } else {
      investmentTotal = (investmentTotal * (1 + expectedReturn/100/12)) + monthlyInvestment;
    }
    
    progression.push({
      month: month,
      savings_total: Math.round(savingsTotal),
      investment_total: Math.round(investmentTotal),
      cumulative_total: Math.round(savingsTotal + investmentTotal)
    });
  }

  return {
    risk_profile: riskProfile,
    monthly_savings: monthlySavings,
    monthly_investment: monthlyInvestment,
    total_monthly: monthlySavings + monthlyInvestment,
    expected_return: expectedReturn,
    months: months,
    years: Math.floor(months / 12),
    remaining_months: months % 12,
    investment_options: investmentOptions,
    progression: progression
  };
}

function calculateCompoundGrowthTime(goal, monthlySavings, monthlyInvestment, annualReturn) {
  let month = 0;
  let savingsTotal = 0;
  let investmentTotal = 0;
  let totalValue = 0;
  
  const monthlyReturn = annualReturn / 100 / 12;
  
  while (totalValue < goal && month < 600) { // Max 50 years
    month++;
    savingsTotal += monthlySavings;
    
    if (month === 1) {
      investmentTotal = monthlyInvestment;
    } else {
      investmentTotal = (investmentTotal * (1 + monthlyReturn)) + monthlyInvestment;
    }
    
    totalValue = savingsTotal + investmentTotal;
  }
  
  return month;
}

function getInvestmentOptions(monthlyAmount, riskProfile) {
  const options = [];
  
  if (riskProfile === 'aggressive') {
    options.push(
      {
        name: 'Large Cap Equity Mutual Funds',
        allocation: '40%',
        expected_return: '12-15%',
        risk: 'Medium-High',
        monthly_amount: Math.round(monthlyAmount * 0.4),
        description: 'Diversified equity funds investing in large-cap stocks'
      },
      {
        name: 'Mid & Small Cap Funds',
        allocation: '30%',
        expected_return: '15-18%',
        risk: 'High',
        monthly_amount: Math.round(monthlyAmount * 0.3),
        description: 'Higher growth potential with more volatility'
      },
      {
        name: 'Index ETFs (Nifty/Sensex)',
        allocation: '20%',
        expected_return: '10-12%',
        risk: 'Medium',
        monthly_amount: Math.round(monthlyAmount * 0.2),
        description: 'Low-cost passive investment tracking market'
      },
      {
        name: 'Gold ETF',
        allocation: '10%',
        expected_return: '8-10%',
        risk: 'Low-Medium',
        monthly_amount: Math.round(monthlyAmount * 0.1),
        description: 'Hedge against inflation and currency fluctuation'
      }
    );
  } else if (riskProfile === 'moderate') {
    options.push(
      {
        name: 'Hybrid/Balanced Funds',
        allocation: '40%',
        expected_return: '10-12%',
        risk: 'Medium',
        monthly_amount: Math.round(monthlyAmount * 0.4),
        description: 'Mix of equity and debt for balanced growth'
      },
      {
        name: 'Large Cap Equity Funds',
        allocation: '30%',
        expected_return: '12-14%',
        risk: 'Medium-High',
        monthly_amount: Math.round(monthlyAmount * 0.3),
        description: 'Stable large company stocks'
      },
      {
        name: 'Corporate Bond Funds',
        allocation: '20%',
        expected_return: '7-9%',
        risk: 'Low-Medium',
        monthly_amount: Math.round(monthlyAmount * 0.2),
        description: 'Higher yielding debt instruments'
      },
      {
        name: 'PPF/ELSS (Tax Saving)',
        allocation: '10%',
        expected_return: '7-12%',
        risk: 'Low-Medium',
        monthly_amount: Math.round(monthlyAmount * 0.1),
        description: 'Tax-saving investments under Section 80C'
      }
    );
  } else {
    options.push(
      {
        name: 'PPF (Public Provident Fund)',
        allocation: '40%',
        expected_return: '7-8%',
        risk: 'Very Low',
        monthly_amount: Math.round(monthlyAmount * 0.4),
        description: '15-year tax-free investment with guaranteed returns'
      },
      {
        name: 'Corporate Bond Funds',
        allocation: '30%',
        expected_return: '6-8%',
        risk: 'Low',
        monthly_amount: Math.round(monthlyAmount * 0.3),
        description: 'Stable corporate debt instruments'
      },
      {
        name: 'Bank Fixed Deposits',
        allocation: '20%',
        expected_return: '5-7%',
        risk: 'Very Low',
        monthly_amount: Math.round(monthlyAmount * 0.2),
        description: 'Guaranteed returns with capital protection'
      },
      {
        name: 'Debt Mutual Funds',
        allocation: '10%',
        expected_return: '6-8%',
        risk: 'Low',
        monthly_amount: Math.round(monthlyAmount * 0.1),
        description: 'Government and corporate bonds portfolio'
      }
    );
  }
  
  return options;
}

function calculateTaxOptimization(monthlyIncome, monthlyInvestment) {
  const annualIncome = monthlyIncome * 12;
  const annualInvestment = monthlyInvestment * 12;
  
  // Tax slab calculation (assuming new tax regime for simplicity)
  let taxWithoutInvestment = 0;
  if (annualIncome > 250000) {
    if (annualIncome <= 500000) {
      taxWithoutInvestment = (annualIncome - 250000) * 0.05;
    } else if (annualIncome <= 750000) {
      taxWithoutInvestment = 250000 * 0.05 + (annualIncome - 500000) * 0.10;
    } else if (annualIncome <= 1000000) {
      taxWithoutInvestment = 250000 * 0.05 + 250000 * 0.10 + (annualIncome - 750000) * 0.15;
    } else if (annualIncome <= 1250000) {
      taxWithoutInvestment = 250000 * 0.05 + 250000 * 0.10 + 250000 * 0.15 + (annualIncome - 1000000) * 0.20;
    } else if (annualIncome <= 1500000) {
      taxWithoutInvestment = 250000 * 0.05 + 250000 * 0.10 + 250000 * 0.15 + 250000 * 0.20 + (annualIncome - 1250000) * 0.25;
    } else {
      taxWithoutInvestment = 250000 * 0.05 + 250000 * 0.10 + 250000 * 0.15 + 250000 * 0.20 + 250000 * 0.25 + (annualIncome - 1500000) * 0.30;
    }
  }

  // Tax savings from investments (Section 80C)
  const section80cLimit = 150000;
  const taxDeduction = Math.min(annualInvestment, section80cLimit);
  const taxSaved = taxDeduction * (annualIncome > 1000000 ? 0.30 : annualIncome > 500000 ? 0.20 : 0.05);
  
  // Additional benefits
  const npsAdditionalDeduction = Math.min(50000, annualInvestment * 0.2); // 20% in NPS
  const additionalTaxSaved = npsAdditionalDeduction * (annualIncome > 1000000 ? 0.30 : annualIncome > 500000 ? 0.20 : 0.05);
  
  const totalTaxSaved = taxSaved + additionalTaxSaved;
  const netInvestmentCost = annualInvestment - totalTaxSaved;
  const effectiveReturn = totalTaxSaved / annualInvestment * 100;

  return {
    annual_investment: annualInvestment,
    section_80c_deduction: taxDeduction,
    nps_additional_deduction: npsAdditionalDeduction,
    total_tax_saved: Math.round(totalTaxSaved),
    net_investment_cost: Math.round(netInvestmentCost),
    effective_return_boost: `+${effectiveReturn.toFixed(1)}%`,
    recommendations: [
      'Maximize Section 80C limit (₹1.5 lakh) through ELSS, PPF, or life insurance',
      'Consider additional ₹50k in NPS for extra tax deduction under 80CCD(1B)',
      'Health insurance premiums qualify for Section 80D deduction (₹25k-₹50k)'
    ]
  };
}

function generateTimelineComparison(monthlySavings, monthlyInvestment, returnRate, goal) {
  const savingsData = [];
  const investingData = [];
  
  let savingsTotal = 0;
  let investmentSavings = 0;
  let investmentTotal = 0;
  const monthlyReturn = returnRate / 100 / 12;
  
  for (let month = 1; month <= 60; month++) {
    // Savings only
    savingsTotal += monthlySavings + monthlyInvestment; // Total capacity used for savings
    savingsData.push({
      month: month,
      total: savingsTotal
    });
    
    // Savings + Investing
    investmentSavings += monthlySavings;
    if (month === 1) {
      investmentTotal = monthlyInvestment;
    } else {
      investmentTotal = (investmentTotal * (1 + monthlyReturn)) + monthlyInvestment;
    }
    
    investingData.push({
      month: month,
      total: Math.round(investmentSavings + investmentTotal)
    });
  }
  
  return {
    savings_only: savingsData,
    savings_investing: investingData,
    goal_amount: goal
  };
}

function getRecommendedFirstStep(disposableIncome, age, goal) {
  if (disposableIncome < 10000) {
    return {
      action: 'Build Emergency Fund',
      description: 'Start with building 3-6 months emergency fund in savings account',
      amount: '₹2,000-3,000/month',
      priority: 'High'
    };
  } else if (age < 30 && disposableIncome > 15000) {
    return {
      action: 'Start SIP in ELSS',
      description: 'Begin with tax-saving ELSS mutual fund SIP for dual benefit',
      amount: `₹${Math.min(12500, Math.floor(disposableIncome * 0.3))}/month`,
      priority: 'High'
    };
  } else if (disposableIncome > 20000) {
    return {
      action: 'Hybrid Approach',
      description: 'Split between PPF (safety) and equity mutual funds (growth)',
      amount: `₹${Math.floor(disposableIncome * 0.4)}/month`,
      priority: 'Medium'
    };
  } else {
    return {
      action: 'Start PPF',
      description: 'Begin with safe PPF investment for tax benefits and guaranteed returns',
      amount: `₹${Math.min(12500, Math.floor(disposableIncome * 0.5))}/month`,
      priority: 'Medium'
    };
  }
}

function generateFriendlySummary(timeSaved, investingPlan, firstStep) {
  const yearsSaved = Math.floor(timeSaved / 12);
  const monthsSaved = timeSaved % 12;
  
  let timePhrase = '';
  if (yearsSaved > 0) {
    timePhrase = `${yearsSaved} year${yearsSaved > 1 ? 's' : ''}`;
    if (monthsSaved > 0) {
      timePhrase += ` and ${monthsSaved} month${monthsSaved > 1 ? 's' : ''}`;
    }
  } else {
    timePhrase = `${monthsSaved} month${monthsSaved > 1 ? 's' : ''}`;
  }

  return {
    time_saved: timePhrase,
    key_benefit: `By investing smartly, you can reach your goal ${timePhrase} faster than saving alone!`,
    recommended_action: firstStep.action,
    next_step: `Start with ${firstStep.amount} in ${firstStep.description.toLowerCase()}`,
    motivation: timeSaved > 12 
      ? "🚀 That's more than a year of your life you get back! Time is your biggest asset."
      : "💡 Every month saved is a month closer to financial freedom. Start today!"
  };
}

module.exports = router;