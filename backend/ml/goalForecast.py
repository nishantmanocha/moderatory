#!/usr/bin/env python3

import sys
import json
from datetime import datetime, timedelta

def calculate_goal_projection(user_data, transaction_history):
    """
    Project when user will reach their savings goal based on historical data
    Simplified version using linear projection and trend analysis
    """
    
    try:
        savings_goal = float(user_data.get('savings_goal', 0))
        
        if savings_goal <= 0:
            return {
                "goal_date": None,
                "months_to_goal": None,
                "projected_amount": 0,
                "weekly_trend": 0,
                "message": "Please set a savings goal to see projections"
            }
        
        # Calculate savings from transaction history
        savings_transactions = [
            t for t in transaction_history 
            if t.get('category') == 'Income' or (
                t.get('amount', 0) > 0 and t.get('description', '').lower().find('saving') != -1
            )
        ]
        
        # Calculate current savings and weekly trend
        current_savings = 0
        weekly_savings = []
        
        if transaction_history:
            # Group transactions by week
            transactions_by_date = {}
            for t in transaction_history:
                date = t.get('date', datetime.now().strftime('%Y-%m-%d'))
                amount = float(t.get('amount', 0))
                category = t.get('category', '')
                
                if date not in transactions_by_date:
                    transactions_by_date[date] = {'income': 0, 'expenses': 0}
                
                if category == 'Income':
                    transactions_by_date[date]['income'] += amount
                elif category in ['Essential', 'Discretionary', 'Debt']:
                    transactions_by_date[date]['expenses'] += abs(amount)
            
            # Calculate weekly net savings
            sorted_dates = sorted(transactions_by_date.keys())
            if sorted_dates:
                for i in range(0, len(sorted_dates), 7):
                    week_dates = sorted_dates[i:i+7]
                    week_income = sum(transactions_by_date[d]['income'] for d in week_dates)
                    week_expenses = sum(transactions_by_date[d]['expenses'] for d in week_dates)
                    week_savings = week_income - week_expenses
                    weekly_savings.append(max(0, week_savings))
                    current_savings += max(0, week_savings)
        
        # Calculate average weekly savings
        if weekly_savings:
            avg_weekly_savings = sum(weekly_savings) / len(weekly_savings)
            recent_trend = sum(weekly_savings[-2:]) / 2 if len(weekly_savings) >= 2 else avg_weekly_savings
        else:
            # Fallback calculation based on user input
            monthly_income = float(user_data.get('monthly_income', 0))
            monthly_expenses = float(user_data.get('monthly_rent', 0)) + float(user_data.get('monthly_emi', 0))
            estimated_monthly_savings = max(0, (monthly_income - monthly_expenses) * 0.2)  # Assume 20% savings rate
            avg_weekly_savings = estimated_monthly_savings / 4
            recent_trend = avg_weekly_savings
        
        remaining_goal = max(0, savings_goal - current_savings)
        
        if avg_weekly_savings <= 0:
            return {
                "goal_date": None,
                "months_to_goal": None,
                "projected_amount": current_savings,
                "weekly_trend": 0,
                "message": "Increase your savings rate to reach your goal"
            }
        
        # Project timeline to reach goal
        weeks_to_goal = remaining_goal / avg_weekly_savings
        months_to_goal = weeks_to_goal / 4.33  # Average weeks per month
        goal_date = datetime.now() + timedelta(weeks=weeks_to_goal)
        
        # Calculate improvement impact
        improvement_factor = 1.2  # 20% improvement
        improved_weekly_savings = avg_weekly_savings * improvement_factor
        improved_weeks_to_goal = remaining_goal / improved_weekly_savings
        improved_months_to_goal = improved_weeks_to_goal / 4.33
        months_sooner = months_to_goal - improved_months_to_goal
        
        return {
            "goal_date": goal_date.strftime('%Y-%m-%d'),
            "months_to_goal": round(months_to_goal, 1),
            "projected_amount": round(current_savings, 2),
            "weekly_trend": round(recent_trend, 2),
            "savings_goal": savings_goal,
            "remaining_amount": round(remaining_goal, 2),
            "improvement_impact": {
                "months_sooner": round(months_sooner, 1),
                "improved_weekly_savings": round(improved_weekly_savings, 2)
            },
            "message": f"At current rate, you'll reach ₹{savings_goal:,.0f} by {goal_date.strftime('%B %Y')}"
        }
        
    except Exception as e:
        return {
            "goal_date": None,
            "months_to_goal": None,
            "projected_amount": 0,
            "weekly_trend": 0,
            "message": f"Unable to calculate projection: {str(e)}"
        }

def main():
    try:
        if len(sys.argv) < 3:
            raise ValueError("Insufficient arguments")
        
        user_data = json.loads(sys.argv[1])
        transaction_history = json.loads(sys.argv[2])
        
        result = calculate_goal_projection(user_data, transaction_history)
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "goal_date": None,
            "months_to_goal": None,
            "projected_amount": 0,
            "weekly_trend": 0,
            "message": f"Error in calculation: {str(e)}"
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()