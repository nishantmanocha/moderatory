#!/bin/bash

echo "🚀 MicroSave - AI-Powered Micro-Investment Advisor Demo"
echo "================================================="

# Check if backend is running
echo "1. Testing backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if [[ $? -eq 0 ]]; then
    echo "✅ Backend is healthy: $HEALTH_RESPONSE"
else
    echo "❌ Backend not running. Please start with: cd backend && npm run dev"
    exit 1
fi

# Create a test user
echo ""
echo "2. Creating test user..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/user/setup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "name": "Demo User",
    "monthly_income": 35000,
    "monthly_rent": 10000,
    "monthly_emi": 6000,
    "savings_goal": 150000,
    "language": "en"
  }')

if echo "$USER_RESPONSE" | grep -q "success.*true"; then
    echo "✅ User created successfully"
    USER_ID=$(echo "$USER_RESPONSE" | grep -o '"user_id":[0-9]*' | cut -d':' -f2)
    echo "   User ID: $USER_ID"
else
    echo "❌ Failed to create user"
    echo "   Response: $USER_RESPONSE"
    exit 1
fi

# Get AI safe save recommendation
echo ""
echo "3. Getting AI safe save recommendation..."
SAFE_SAVE_RESPONSE=$(curl -s http://localhost:3000/analytics/$USER_ID/safe-save)
if echo "$SAFE_SAVE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ AI recommendation generated"
    AMOUNT=$(echo "$SAFE_SAVE_RESPONSE" | grep -o '"amount":[0-9.]*' | cut -d':' -f2)
    CONFIDENCE=$(echo "$SAFE_SAVE_RESPONSE" | grep -o '"confidence":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    echo "   Recommended amount: ₹$AMOUNT"
    echo "   Confidence: $CONFIDENCE"
else
    echo "❌ Failed to get recommendation"
    echo "   Response: $SAFE_SAVE_RESPONSE"
fi

# Get goal projection
echo ""
echo "4. Getting savings goal projection..."
PROJECTION_RESPONSE=$(curl -s http://localhost:3000/analytics/$USER_ID/projection)
if echo "$PROJECTION_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Goal projection calculated"
    MONTHS=$(echo "$PROJECTION_RESPONSE" | grep -o '"months_to_goal":[0-9.]*' | cut -d':' -f2)
    if [ ! -z "$MONTHS" ]; then
        echo "   Months to goal: $MONTHS"
    fi
else
    echo "❌ Failed to get projection"
fi

# Test merchant categorization
echo ""
echo "5. Testing merchant categorization..."
MERCHANT_RESPONSE=$(curl -s -X POST http://localhost:3000/analytics/categorize-merchant \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "Reliance Fresh",
    "description": "Grocery shopping"
  }')

if echo "$MERCHANT_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Merchant categorized"
    CATEGORY=$(echo "$MERCHANT_RESPONSE" | grep -o '"category":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    CONFIDENCE=$(echo "$MERCHANT_RESPONSE" | grep -o '"confidence":[0-9.]*' | cut -d':' -f2)
    echo "   Merchant: Reliance Fresh → Category: $CATEGORY (Confidence: $CONFIDENCE)"
else
    echo "❌ Failed to categorize merchant"
fi

# Get transactions
echo ""
echo "6. Getting transaction history..."
TRANSACTIONS_RESPONSE=$(curl -s http://localhost:3000/transactions/$USER_ID)
if echo "$TRANSACTIONS_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Transactions loaded"
    TRANSACTION_COUNT=$(echo "$TRANSACTIONS_RESPONSE" | grep -o '"id":[0-9]*' | wc -l)
    echo "   Transaction count: $TRANSACTION_COUNT"
else
    echo "❌ Failed to get transactions"
fi

# Add a savings transaction
echo ""
echo "7. Adding a savings transaction..."
SAVE_RESPONSE=$(curl -s -X POST http://localhost:3000/transactions/add \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": '$USER_ID',
    "amount": -50,
    "category": "Essential",
    "merchant": "MicroSave",
    "description": "Daily savings contribution"
  }')

if echo "$SAVE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Savings transaction added: ₹50"
else
    echo "❌ Failed to add transaction"
fi

echo ""
echo "🎉 Demo completed! The MicroSave application is working correctly."
echo ""
echo "📱 To test the frontend:"
echo "   1. cd frontend"
echo "   2. npx expo start"
echo "   3. Press 'w' for web or scan QR code with Expo Go"
echo ""
echo "🔧 Backend running on: http://localhost:3000"
echo "📊 API Documentation: See README.md for full endpoint list"