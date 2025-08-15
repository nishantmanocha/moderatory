# MicroSave - AI-Powered Micro-Investment Advisor

A full-stack AI-powered micro-investment advisor designed specifically for low-income users to help them build wealth through smart, small savings.

## 🌟 Features

### Frontend (React Native + Expo Router)
- **Modern UI Design**: Clean, accessible interface with Ivory background and emerald green theme
- **Multilingual Support**: English, Hindi, and Punjabi language options
- **Onboarding Flow**: User setup with income, rent, EMI, and savings goals
- **AI Dashboard**: Real-time savings recommendations with confidence indicators
- **Transaction Tracking**: Categorized transaction history with refresh functionality
- **Smart Navigation**: Bottom tab navigation with intuitive icons

### Backend (Node.js + Express)
- **RESTful API**: Complete API for user management, transactions, and analytics
- **SQLite Database**: Lightweight database for user profiles, transactions, and budgets
- **ML Integration**: Python scripts for AI-powered recommendations
- **Data Generation**: Realistic fake transaction generator for demo purposes

### AI/ML Components
1. **Safe Save Model** (`safeSaveModel.py`): Rule-based algorithm that recommends daily savings amounts based on spending patterns
2. **Goal Forecast** (`goalForecast.py`): Linear projection model to predict when users will reach savings goals
3. **Merchant Categorizer** (`merchantCategorizer.py`): Keyword-based classification for transaction categorization

## 🏗 Architecture

```
MicroSave/
├── frontend/                 # React Native + Expo app
│   ├── app/                 # Expo Router pages
│   │   ├── _layout.tsx      # Root layout
│   │   ├── index.tsx        # Welcome screen
│   │   ├── onboarding/      # Onboarding flow
│   │   └── (tabs)/          # Main app tabs
│   └── services/api.ts      # API service layer
├── backend/                 # Node.js + Express server
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   └── middleware/      # Express middleware
│   └── ml/                  # Python ML scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- npm or yarn
- Expo CLI

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

   The backend will be available at `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Expo development server:**
   ```bash
   npx expo start
   ```

4. **Choose your platform:**
   - Press `w` for web
   - Press `a` for Android (with emulator)
   - Press `i` for iOS (with simulator)
   - Scan QR code with Expo Go app

## 🔧 API Endpoints

### User Management
- `POST /user/setup` - Create/update user profile
- `GET /user/:userId` - Get user profile
- `GET /user?phone=xxx` - Get user by phone

### Transactions
- `GET /transactions/:userId` - Get user transactions
- `POST /transactions/add` - Add new transaction
- `PUT /transactions/:id` - Update transaction category
- `POST /transactions/:userId/generate-fresh` - Generate demo data

### AI Analytics
- `GET /analytics/:userId/safe-save` - Get AI savings recommendation
- `GET /analytics/:userId/projection` - Get goal projection
- `POST /analytics/categorize-merchant` - Categorize merchant
- `GET /analytics/:userId/spending-insights` - Get spending analysis

### Budget & Education
- `GET /budget/:userId` - Get user budget
- `PUT /budget/:userId` - Update budget
- `GET /education/tips` - Get financial tips
- `GET /education/videos` - Get educational content

## 🧪 Testing the Application

1. **Start Backend:**
   ```bash
   cd backend && npm run dev
   ```

2. **Test API Health:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Create Test User:**
   ```bash
   curl -X POST http://localhost:3000/user/setup \
     -H "Content-Type: application/json" \
     -d '{"phone":"+919876543210","name":"Test User","monthly_income":30000,"monthly_rent":8000,"monthly_emi":5000,"savings_goal":100000}'
   ```

4. **Get AI Recommendation:**
   ```bash
   curl http://localhost:3000/analytics/1/safe-save
   ```

## 🎨 Design System

### Colors
- **Primary**: #006B3F (Emerald Green)
- **Accent**: #FFD700 (Gold), #FF914D (Soft Orange)
- **Background**: #FAF8F0 (Ivory)
- **Text**: #003153 (Deep Navy)

### Typography
- **Headings**: Poppins (bold)
- **Body**: Inter (regular)

### Components
- **Buttons**: Rounded corners (12px), solid fill, drop shadow
- **Cards**: White background, rounded corners (16px), subtle shadow
- **Icons**: Lucide React Native + Emojis

## 🤖 AI/ML Features

### Safe Save Recommendation
- Analyzes user's disposable income
- Considers recent spending patterns
- Provides conservative, moderate, and aggressive options
- Real-time confidence scoring

### Goal Projection
- Linear forecasting based on transaction history
- Calculates timeline to reach savings goals
- Suggests improvement strategies
- Accounts for income vs. expense patterns

### Smart Categorization
- Automatic merchant categorization
- Categories: Income, Essential, Discretionary, Debt
- Keyword-based classification with Indian merchant names
- Confidence scoring for suggestions

## 📱 Mobile Features

### Responsive Design
- Works on web, iOS, and Android
- Touch-optimized interface
- Native navigation patterns
- Offline-first architecture ready

### User Experience
- Smooth animations with React Native Reanimated
- Pull-to-refresh on transaction lists
- Loading states for all async operations
- Error handling with user-friendly messages

## 🔮 Future Enhancements

### ML Improvements
- Replace rule-based models with trained ML models
- Integrate real Hugging Face transformers
- Add time-series forecasting with Prophet
- Implement collaborative filtering for recommendations

### Features
- Real SMS transaction parsing
- Push notifications for savings reminders
- Investment recommendations
- Community features and challenges
- Bank account integration
- Expense photo capture with OCR

### Security
- JWT authentication
- Data encryption at rest
- Secure API key management
- Privacy-compliant data handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for low-income users to democratize financial planning
- Designed with accessibility and multilingual support in mind
- Inspired by the need for inclusive fintech solutions in India

---

**Note**: This is a demonstration project. For production use, implement proper security measures, data encryption, and compliance with financial regulations.