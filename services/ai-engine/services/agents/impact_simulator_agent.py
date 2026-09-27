"""
Financial Health Copilot Impact Simulator Agent

Process What-If queries from the user and calculate the projected
impact on cash flow, debt, savings, and affordability.
"""

import logging
from datetime import date, timedelta
from typing import Optional

from groq import AsyncGroq

from config import get_settings
from models import db
from services.agents.cashflow_agent import get_forecast

logger = logging.getLogger(__name__)
settings = get_settings()

SIMULATOR_PROMPT = """You are the AI Financial Health Simulator.
The user is asking a "What if?" question about their finances.
Extract the theoretical action they want to take into a structured JSON format.

Supported actions: "new_loan", "increase_expense", "increase_savings".
Return JSON ONLY.

Example user: "What happens if I take a 50k loan?"
Output: {"action": "new_loan", "amount": 50000}

Example user: "Can I afford to increase my SIP by 5000?"
Output: {"action": "increase_savings", "amount": 5000}

Example user: "What if my rent increases by 3000?"
Output: {"action": "increase_expense", "amount": 3000}
"""

async def simulate_impact(merchant_id: str, query: str) -> dict:
    """Parse the query and return the simulated impact."""
    
    # 1. Parse intent using LLM
    try:
        client = AsyncGroq(api_key=settings.groq_api_key)
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SIMULATOR_PROMPT},
                {"role": "user", "content": query},
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        import json
        intent = json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error("Simulator parsing failed: %s", e)
        return {"error": "Could not parse simulation query"}

    # 2. Get baseline forecast
    forecast = await get_forecast(merchant_id, days=30)
    baseline_net = forecast["summary"]["total_predicted_net"]
    avg_expense = forecast["summary"]["avg_daily_expense"] * 30
    
    action = intent.get("action")
    amount = intent.get("amount", 0)

    # 3. Simulate
    if action == "new_loan":
        # Assume 10% interest over 12 months for simple EMI calc
        emi = (amount * 1.1) / 12
        new_net = baseline_net - emi
        affordability = "High Risk" if emi > (baseline_net * 0.8) else "Manageable"
        
        return {
            "baseline_cashflow": baseline_net,
            "simulated_cashflow": new_net,
            "monthly_impact": -emi,
            "affordability": affordability,
            "recommendation_hi": f"Taking a loan will increase your EMI by Rs {emi:,.0f}/month. \n📈 EXPECTED IMPACT: Cashflow will reduce to Rs {new_net:,.0f}."
        }
    elif action == "increase_savings":
        new_net = baseline_net - amount
        affordability = "High Risk" if new_net < 5000 else "Safe"
        return {
            "baseline_cashflow": baseline_net,
            "simulated_cashflow": new_net,
            "monthly_impact": -amount,
            "affordability": affordability,
            "recommendation_hi": f"Increasing SIP by Rs {amount:,.0f} will grow your future wealth. \n📈 EXPECTED IMPACT: Monthly cash buffer drops to Rs {new_net:,.0f}, but long-term savings increase."
        }
    elif action == "increase_expense":
        new_net = baseline_net - amount
        affordability = "High Risk" if new_net < 0 else "Manageable"
        return {
            "baseline_cashflow": baseline_net,
            "simulated_cashflow": new_net,
            "monthly_impact": -amount,
            "affordability": affordability,
            "recommendation_hi": f"Expenses will increase by Rs {amount:,.0f}. \n📈 EXPECTED IMPACT: You will have Rs {new_net:,.0f} left at the end of the month."
        }
        
    return {"error": "Unsupported simulation"}
