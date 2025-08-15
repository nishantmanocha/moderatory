#!/usr/bin/env python3

import sys
import json
import random
from datetime import datetime, timedelta

def calculate_safe_save_amount(user_data, recent_transactions):
    """
    Calculate a safe daily save amount based on user's financial situation
    This is a simplified rule-based model that will be enhanced with ML later
    """
    
    try:
        # Parse input data
        monthly_income = float(user_data.get('monthly_income', 0))
        monthly_rent = float(user_data.get('monthly_rent', 0))
        monthly_emi = float(user_data.get('monthly_emi', 0))
        
        # Calculate daily disposable income
        monthly_fixed_expenses = monthly_rent + monthly_emi
        monthly_disposable = monthly_income - monthly_fixed_expenses
        daily_disposable = monthly_disposable / 30
        
        # Analyze recent spending patterns
        recent_daily_spend = 0
        if recent_transactions:
            total_spend = sum(abs(float(t.get('amount', 0))) for t in recent_transactions 
                            if t.get('category') in ['Essential', 'Discretionary'])
            days_count = len(set(t.get('date') for t in recent_transactions)) or 1
            recent_daily_spend = total_spend / days_count
        
        # Calculate safe save amounts with different confidence levels
        conservative_save = max(10, daily_disposable * 0.05)  # 5% of disposable income
        moderate_save = max(20, daily_disposable * 0.10)      # 10% of disposable income  
        aggressive_save = max(30, daily_disposable * 0.15)    # 15% of disposable income
        
        # Adjust based on recent spending
        if recent_daily_spend > 0:
            spending_ratio = recent_daily_spend / daily_disposable if daily_disposable > 0 else 1
            if spending_ratio > 0.8:  # High spending day
                recommended_amount = conservative_save
                confidence = "Low"
            elif spending_ratio > 0.5:  # Moderate spending day
                recommended_amount = moderate_save
                confidence = "Medium"
            else:  # Low spending day
                recommended_amount = aggressive_save
                confidence = "High"
        else:
            recommended_amount = moderate_save
            confidence = "Medium"
        
        # Ensure minimum and maximum bounds
        recommended_amount = max(5, min(recommended_amount, daily_disposable * 0.2))
        
        return {
            "amount": round(recommended_amount, 2),
            "confidence": confidence,
            "reasoning": f"Based on ₹{daily_disposable:.0f} daily disposable income",
            "alternatives": {
                "conservative": round(conservative_save, 2),
                "moderate": round(moderate_save, 2),
                "aggressive": round(aggressive_save, 2)
            }
        }
        
    except Exception as e:
        # Fallback safe amounts
        return {
            "amount": 15.0,
            "confidence": "Low",
            "reasoning": "Default recommendation due to insufficient data",
            "alternatives": {
                "conservative": 10.0,
                "moderate": 15.0,
                "aggressive": 25.0
            }
        }

def main():
    try:
        # Read input from command line arguments
        if len(sys.argv) < 3:
            raise ValueError("Insufficient arguments")
        
        user_data = json.loads(sys.argv[1])
        recent_transactions = json.loads(sys.argv[2])
        
        result = calculate_safe_save_amount(user_data, recent_transactions)
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "amount": 15.0,
            "confidence": "Low", 
            "reasoning": f"Error in calculation: {str(e)}",
            "alternatives": {
                "conservative": 10.0,
                "moderate": 15.0,
                "aggressive": 25.0
            }
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()