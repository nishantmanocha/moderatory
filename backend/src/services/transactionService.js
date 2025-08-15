const { getDB } = require('../models/database');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
  static generateFakeTransactions(userId, count = 25) {
    const merchants = {
      Essential: [
        { name: 'Reliance Fresh', amounts: [250, 400, 180, 320] },
        { name: 'Big Bazaar', amounts: [500, 750, 300, 600] },
        { name: 'Apollo Pharmacy', amounts: [150, 80, 220, 95] },
        { name: 'BPCL Petrol Pump', amounts: [500, 800, 600, 700] },
        { name: 'Metro Card Recharge', amounts: [100, 200, 150, 300] },
        { name: 'Electricity Bill', amounts: [800, 1200, 950, 1100] },
        { name: 'Water Bill', amounts: [200, 300, 250, 180] },
        { name: 'Grocery Store', amounts: [300, 450, 200, 380] },
      ],
      Discretionary: [
        { name: 'Zomato', amounts: [180, 250, 120, 300] },
        { name: 'Amazon', amounts: [500, 1200, 800, 350] },
        { name: 'BookMyShow', amounts: [200, 350, 180, 400] },
        { name: 'Uber', amounts: [80, 150, 120, 200] },
        { name: 'Starbucks', amounts: [150, 200, 180, 120] },
        { name: 'Myntra', amounts: [800, 1500, 600, 1200] },
        { name: 'Flipkart', amounts: [400, 900, 550, 750] },
        { name: 'McDonald\'s', amounts: [150, 250, 180, 200] },
      ],
      Debt: [
        { name: 'HDFC Credit Card', amounts: [2000, 3500, 1800, 4000] },
        { name: 'SBI Loan EMI', amounts: [5000, 7500, 6000, 8000] },
        { name: 'Bajaj Finserv', amounts: [1500, 2500, 1800, 3000] },
      ],
      Income: [
        { name: 'Salary Credit', amounts: [25000, 30000, 35000, 40000] },
        { name: 'Freelance Payment', amounts: [2000, 5000, 3500, 4000] },
        { name: 'Bank Interest', amounts: [150, 200, 180, 250] },
        { name: 'Cashback', amounts: [50, 100, 75, 120] },
      ]
    };

    const transactions = [];
    const today = moment();

    for (let i = 0; i < count; i++) {
      // Random category
      const categories = Object.keys(merchants);
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Random merchant from category
      const categoryMerchants = merchants[category];
      const merchant = categoryMerchants[Math.floor(Math.random() * categoryMerchants.length)];
      
      // Random amount from merchant's typical amounts
      const amount = merchant.amounts[Math.floor(Math.random() * merchant.amounts.length)];
      
      // Random date within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const transactionDate = today.clone().subtract(daysAgo, 'days').format('YYYY-MM-DD');
      
      // Adjust amount sign based on category
      const finalAmount = category === 'Income' ? amount : -amount;
      
      transactions.push({
        user_id: userId,
        amount: finalAmount,
        category: category,
        merchant: merchant.name,
        description: `${merchant.name} transaction`,
        date: transactionDate
      });
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  static async saveTransactions(transactions) {
    const db = getDB();
    const insertStmt = db.prepare(`
      INSERT INTO transactions (user_id, amount, category, merchant, description, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const savedTransactions = [];
    
    for (const transaction of transactions) {
      try {
        const result = insertStmt.run([
          transaction.user_id,
          transaction.amount,
          transaction.category,
          transaction.merchant,
          transaction.description,
          transaction.date
        ]);
        
        savedTransactions.push({
          id: result.lastID,
          ...transaction
        });
      } catch (error) {
        console.error('Error saving transaction:', error);
      }
    }
    
    insertStmt.finalize();
    return savedTransactions;
  }

  static async getUserTransactions(userId, limit = 100) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM transactions 
        WHERE user_id = ? 
        ORDER BY date DESC, created_at DESC 
        LIMIT ?
      `, [userId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static async getWeeklyTransactions(userId) {
    const db = getDB();
    const oneWeekAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
    
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          date,
          category,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE user_id = ? AND date >= ?
        GROUP BY date, category
        ORDER BY date DESC
      `, [userId, oneWeekAgo], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Group by date for chart data
          const groupedByDate = {};
          rows.forEach(row => {
            if (!groupedByDate[row.date]) {
              groupedByDate[row.date] = {
                date: row.date,
                income: 0,
                expenses: 0,
                net_savings: 0,
                categories: {}
              };
            }
            
            groupedByDate[row.date].income += row.income;
            groupedByDate[row.date].expenses += row.expenses;
            groupedByDate[row.date].categories[row.category] = {
              income: row.income,
              expenses: row.expenses
            };
          });
          
          // Calculate net savings
          Object.keys(groupedByDate).forEach(date => {
            groupedByDate[date].net_savings = groupedByDate[date].income - groupedByDate[date].expenses;
          });
          
          resolve(Object.values(groupedByDate));
        }
      });
    });
  }

  static async updateTransactionCategory(transactionId, category) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE transactions 
        SET category = ? 
        WHERE id = ?
      `, [category, transactionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static async addTransaction(transactionData) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO transactions (user_id, amount, category, merchant, description, date)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        transactionData.user_id,
        transactionData.amount,
        transactionData.category,
        transactionData.merchant,
        transactionData.description,
        transactionData.date || moment().format('YYYY-MM-DD')
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...transactionData });
        }
      });
    });
  }
}

module.exports = TransactionService;