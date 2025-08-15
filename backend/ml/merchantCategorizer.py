#!/usr/bin/env python3

import sys
import json
import re

def categorize_merchant(merchant_name, description=""):
    """
    Categorize merchant into spending categories using rule-based classification
    This will be enhanced with Hugging Face transformers later
    """
    
    merchant_lower = merchant_name.lower()
    description_lower = description.lower()
    combined_text = f"{merchant_lower} {description_lower}"
    
    # Define category keywords
    categories = {
        'Essential': {
            'keywords': [
                'grocery', 'supermarket', 'medical', 'pharmacy', 'hospital', 'clinic',
                'electricity', 'water', 'gas', 'fuel', 'petrol', 'diesel', 'bus', 'train',
                'metro', 'auto', 'school', 'college', 'education', 'tuition', 'rent',
                'vegetable', 'market', 'milk', 'bread', 'rice', 'dal', 'medicine',
                'big bazaar', 'reliance fresh', 'more', 'spencer', 'apollo', 'medplus'
            ],
            'weight': 1.0
        },
        'Discretionary': {
            'keywords': [
                'restaurant', 'cafe', 'movie', 'cinema', 'mall', 'shopping', 'clothes',
                'fashion', 'electronics', 'mobile', 'laptop', 'game', 'entertainment',
                'hotel', 'travel', 'vacation', 'gift', 'jewelry', 'cosmetics', 'beauty',
                'zomato', 'swiggy', 'ubereats', 'dominos', 'mcdonalds', 'kfc', 'starbucks',
                'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'uber', 'ola'
            ],
            'weight': 1.0
        },
        'Debt': {
            'keywords': [
                'loan', 'emi', 'credit card', 'interest', 'bank', 'hdfc', 'icici', 'sbi',
                'axis', 'kotak', 'repayment', 'installment', 'finance', 'lending',
                'bajaj', 'tata capital', 'mahindra finance'
            ],
            'weight': 1.0
        },
        'Income': {
            'keywords': [
                'salary', 'wage', 'payment', 'transfer', 'deposit', 'refund', 'cashback',
                'bonus', 'commission', 'freelance', 'consulting', 'dividend', 'interest earned'
            ],
            'weight': 1.0
        }
    }
    
    # Calculate scores for each category
    category_scores = {}
    
    for category, data in categories.items():
        score = 0
        matched_keywords = []
        
        for keyword in data['keywords']:
            if keyword in combined_text:
                score += data['weight']
                matched_keywords.append(keyword)
        
        category_scores[category] = {
            'score': score,
            'matched_keywords': matched_keywords
        }
    
    # Determine best category
    best_category = max(category_scores.keys(), key=lambda x: category_scores[x]['score'])
    best_score = category_scores[best_category]['score']
    
    # Calculate confidence based on score and specificity
    if best_score == 0:
        # No keywords matched, use fallback logic
        if any(word in combined_text for word in ['pay', 'payment', 'transfer']):
            best_category = 'Essential'
            confidence = 0.3
        else:
            best_category = 'Discretionary'
            confidence = 0.2
    else:
        # Normalize confidence based on keyword matches
        total_possible_score = len(categories[best_category]['keywords'])
        confidence = min(0.95, (best_score / total_possible_score) + 0.3)
    
    return {
        'category': best_category,
        'confidence': round(confidence, 2),
        'matched_keywords': category_scores[best_category]['matched_keywords'],
        'all_scores': {cat: data['score'] for cat, data in category_scores.items()},
        'reasoning': f"Classified as {best_category} based on keywords: {', '.join(category_scores[best_category]['matched_keywords'][:3])}"
    }

def main():
    try:
        if len(sys.argv) < 2:
            raise ValueError("Insufficient arguments")
        
        input_data = json.loads(sys.argv[1])
        merchant_name = input_data.get('merchant', '')
        description = input_data.get('description', '')
        
        if not merchant_name:
            raise ValueError("Merchant name is required")
        
        result = categorize_merchant(merchant_name, description)
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'category': 'Discretionary',
            'confidence': 0.1,
            'matched_keywords': [],
            'all_scores': {},
            'reasoning': f"Error in categorization: {str(e)}"
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()