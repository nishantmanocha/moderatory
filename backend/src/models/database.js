const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database.db';

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async init() {
    if (!this.db) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const createTables = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE,
          name TEXT,
          monthly_income REAL,
          monthly_rent REAL,
          monthly_emi REAL,
          savings_goal REAL,
          language TEXT DEFAULT 'en',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Transactions table
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          amount REAL NOT NULL,
          category TEXT CHECK(category IN ('Income', 'Essential', 'Discretionary', 'Debt')),
          merchant TEXT,
          description TEXT,
          date DATE DEFAULT CURRENT_DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        -- Budget table
        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          essential_percentage REAL DEFAULT 50.0,
          discretionary_percentage REAL DEFAULT 30.0,
          savings_percentage REAL DEFAULT 20.0,
          emergency_fund_target REAL DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        -- Savings table
        CREATE TABLE IF NOT EXISTS savings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          amount REAL NOT NULL,
          date DATE DEFAULT CURRENT_DATE,
          is_paused BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        -- Financial tips table
        CREATE TABLE IF NOT EXISTS financial_tips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          language TEXT DEFAULT 'en',
          category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      this.db.exec(createTables, (err) => {
        if (err) {
          console.error('❌ Error creating tables:', err.message);
          reject(err);
        } else {
          console.log('✅ Database tables initialized');
          this.insertDefaultData();
          resolve();
        }
      });
    });
  }

  insertDefaultData() {
    const tips = [
      { content: "Start small - even ₹10 saved daily becomes ₹3,650 in a year!", language: 'en', category: 'motivation' },
      { content: "Track your expenses for one week to identify spending patterns", language: 'en', category: 'budgeting' },
      { content: "Create an emergency fund equal to 3-6 months of expenses", language: 'en', category: 'emergency' },
      { content: "Automate your savings to make it effortless", language: 'en', category: 'automation' },
      { content: "छोटी शुरुआत करें - रोज़ाना ₹10 की बचत साल में ₹3,650 बन जाती है!", language: 'hi', category: 'motivation' },
      { content: "ਛੋਟੀ ਸ਼ੁਰੂਆਤ ਕਰੋ - ਰੋਜ਼ਾਨਾ ₹10 ਦੀ ਬਚਤ ਸਾਲ ਵਿੱਚ ₹3,650 ਬਣ ਜਾਂਦੀ ਹੈ!", language: 'pb', category: 'motivation' }
    ];

    const insertTip = this.db.prepare('INSERT OR IGNORE INTO financial_tips (content, language, category) VALUES (?, ?, ?)');
    
    tips.forEach(tip => {
      insertTip.run([tip.content, tip.language, tip.category]);
    });
    
    insertTip.finalize();
  }

  getDB() {
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

const database = new Database();

const initializeDatabase = async () => {
  try {
    await database.init();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

module.exports = {
  database,
  initializeDatabase,
  getDB: () => database.getDB()
};