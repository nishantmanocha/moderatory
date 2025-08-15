const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDB } = require('../models/database');

const router = express.Router();

// GET /education/tips - Get financial tips
router.get('/tips', asyncHandler(async (req, res) => {
  const { lang = 'en', category, limit = 10 } = req.query;
  const db = getDB();

  let query = 'SELECT * FROM financial_tips WHERE language = ?';
  const params = [lang];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY RANDOM() LIMIT ?';
  params.push(parseInt(limit));

  const tips = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({
    success: true,
    tips,
    language: lang,
    category: category || 'all'
  });
}));

// GET /education/videos - Get educational video content
router.get('/videos', asyncHandler(async (req, res) => {
  const { lang = 'en' } = req.query;

  // Static video content - in a real app, this would come from a database or CMS
  const videos = {
    en: [
      {
        id: 1,
        title: "Basics of Micro-Savings",
        description: "Learn how small savings can create big impact over time",
        thumbnail: "https://example.com/thumbnail1.jpg",
        url: "https://example.com/video1.mp4",
        duration: "5:30",
        category: "savings"
      },
      {
        id: 2,
        title: "Smart Budgeting on Low Income",
        description: "Practical budgeting tips for maximizing your limited income",
        thumbnail: "https://example.com/thumbnail2.jpg",
        url: "https://example.com/video2.mp4",
        duration: "7:15",
        category: "budgeting"
      },
      {
        id: 3,
        title: "Avoiding Financial Frauds",
        description: "Common scams and how to protect yourself",
        thumbnail: "https://example.com/thumbnail3.jpg",
        url: "https://example.com/video3.mp4",
        duration: "6:45",
        category: "security"
      },
      {
        id: 4,
        title: "Building Emergency Fund",
        description: "Why and how to build your emergency fund step by step",
        thumbnail: "https://example.com/thumbnail4.jpg",
        url: "https://example.com/video4.mp4",
        duration: "8:20",
        category: "emergency"
      }
    ],
    hi: [
      {
        id: 5,
        title: "सूक्ष्म बचत की मूल बातें",
        description: "जानें कि कैसे छोटी बचत समय के साथ बड़ा प्रभाव बना सकती है",
        thumbnail: "https://example.com/thumbnail1_hi.jpg",
        url: "https://example.com/video1_hi.mp4",
        duration: "5:30",
        category: "savings"
      },
      {
        id: 6,
        title: "कम आय में स्मार्ट बजटिंग",
        description: "सीमित आय को अधिकतम करने के लिए व्यावहारिक बजटिंग टिप्स",
        thumbnail: "https://example.com/thumbnail2_hi.jpg",
        url: "https://example.com/video2_hi.mp4",
        duration: "7:15",
        category: "budgeting"
      }
    ],
    pb: [
      {
        id: 7,
        title: "ਸੂਖਮ ਬਚਤ ਦੀਆਂ ਬੁਨਿਆਦੀ ਗੱਲਾਂ",
        description: "ਸਿੱਖੋ ਕਿ ਕਿਵੇਂ ਛੋਟੀ ਬਚਤ ਸਮੇਂ ਦੇ ਨਾਲ ਵੱਡਾ ਪ੍ਰਭਾਵ ਬਣਾ ਸਕਦੀ ਹੈ",
        thumbnail: "https://example.com/thumbnail1_pb.jpg",
        url: "https://example.com/video1_pb.mp4",
        duration: "5:30",
        category: "savings"
      }
    ]
  };

  const languageVideos = videos[lang] || videos.en;

  res.json({
    success: true,
    videos: languageVideos,
    language: lang,
    total_count: languageVideos.length
  });
}));

// GET /education/categories - Get available tip categories
router.get('/categories', asyncHandler(async (req, res) => {
  const db = getDB();

  const categories = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        category,
        COUNT(*) as tip_count,
        language
      FROM financial_tips 
      GROUP BY category, language
      ORDER BY category, language
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Group by language
  const categoriesByLang = {};
  categories.forEach(cat => {
    if (!categoriesByLang[cat.language]) {
      categoriesByLang[cat.language] = [];
    }
    categoriesByLang[cat.language].push({
      name: cat.category,
      tip_count: cat.tip_count
    });
  });

  res.json({
    success: true,
    categories: categoriesByLang
  });
}));

// POST /education/tips - Add new financial tip (for admin use)
router.post('/tips', asyncHandler(async (req, res) => {
  const { content, language = 'en', category = 'general' } = req.body;

  if (!content) {
    return res.status(400).json({
      error: true,
      message: 'Content is required'
    });
  }

  const db = getDB();

  const result = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO financial_tips (content, language, category)
      VALUES (?, ?, ?)
    `, [content, language, category], function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID });
    });
  });

  res.json({
    success: true,
    tip_id: result.lastID,
    message: 'Financial tip added successfully'
  });
}));

// GET /education/quiz - Get financial literacy quiz questions
router.get('/quiz', asyncHandler(async (req, res) => {
  const { lang = 'en', difficulty = 'easy' } = req.query;

  // Static quiz questions - in a real app, this would come from a database
  const quizQuestions = {
    easy: {
      en: [
        {
          id: 1,
          question: "What percentage of your income should ideally go to savings?",
          options: ["5%", "10%", "20%", "50%"],
          correct_answer: 2,
          explanation: "Financial experts recommend saving at least 20% of your income."
        },
        {
          id: 2,
          question: "Which expense category should be prioritized first?",
          options: ["Entertainment", "Essential needs", "Luxury items", "Gifts"],
          correct_answer: 1,
          explanation: "Essential needs like food, shelter, and healthcare should always be prioritized."
        },
        {
          id: 3,
          question: "How many months of expenses should an emergency fund cover?",
          options: ["1 month", "3-6 months", "1 year", "2 years"],
          correct_answer: 1,
          explanation: "An emergency fund should ideally cover 3-6 months of your expenses."
        }
      ],
      hi: [
        {
          id: 4,
          question: "आपकी आय का कितना प्रतिशत आदर्श रूप से बचत में जाना चाहिए?",
          options: ["5%", "10%", "20%", "50%"],
          correct_answer: 2,
          explanation: "वित्तीय विशेषज्ञ आपकी आय का कम से कम 20% बचत करने की सलाह देते हैं।"
        }
      ]
    }
  };

  const questions = quizQuestions[difficulty]?.[lang] || quizQuestions.easy.en;

  res.json({
    success: true,
    quiz: {
      difficulty,
      language: lang,
      questions: questions.slice(0, 5), // Limit to 5 questions
      total_questions: questions.length
    }
  });
}));

// POST /education/progress - Track user learning progress
router.post('/progress', asyncHandler(async (req, res) => {
  const { user_id, content_type, content_id, completion_percentage = 100, time_spent } = req.body;

  if (!user_id || !content_type || !content_id) {
    return res.status(400).json({
      error: true,
      message: 'user_id, content_type, and content_id are required'
    });
  }

  // In a real app, you'd save this to a learning_progress table
  // For now, we'll just return a success response
  
  res.json({
    success: true,
    message: 'Learning progress tracked successfully',
    progress: {
      user_id,
      content_type,
      content_id,
      completion_percentage,
      time_spent,
      timestamp: new Date().toISOString()
    }
  });
}));

module.exports = router;