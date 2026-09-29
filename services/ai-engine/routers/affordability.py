import logging
from typing import Dict, Any
from fastapi import APIRouter
from .savings import load_savings
from .loans import load_loans
from .accounts import load_accounts

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/{merchant_id}/check")
async def check_affordability(merchant_id: str, payload: dict):
    """
    Check if a user can afford a specific purchase.
    Payload: item_name, cost, payment_mode (upfront/emi), emi_months
    """
    item_name = payload.get("item_name", "Item")
    cost = float(payload.get("cost", 0))
    payment_mode = payload.get("payment_mode", "upfront")
    emi_months = int(payload.get("emi_months", 12))

    savings_data = load_savings().get(merchant_id, {"monthly_income": 120000, "monthly_expenses": 85000})
    monthly_income = savings_data.get("monthly_income", 120000)
    monthly_expenses = savings_data.get("monthly_expenses", 85000)
    surplus = monthly_income - monthly_expenses

    accounts_data = load_accounts().get(merchant_id, [])
    liquid_cash = sum([acc["balance"] for acc in accounts_data if acc["type"] == "bank_account"])
    
    if liquid_cash == 0:
        # Fallback if no accounts data
        liquid_cash = 150000

    can_afford = False
    status_color = "red"
    analysis = []

    if payment_mode == "upfront":
        if liquid_cash >= cost:
            if liquid_cash - cost < 50000: # Arbitrary threshold for emergency
                can_afford = True
                status_color = "yellow"
                analysis.append(f"You have enough cash ({liquid_cash}), but this purchase will drain your liquid funds significantly.")
                analysis.append(f"Your remaining bank balance will be just {liquid_cash - cost}.")
            else:
                can_afford = True
                status_color = "green"
                analysis.append(f"Yes! You can comfortably afford this upfront.")
                analysis.append(f"It will take up {round((cost/liquid_cash)*100, 1)}% of your available cash reserves.")
        else:
            can_afford = False
            status_color = "red"
            analysis.append(f"You do not have enough liquid cash for this purchase right now.")
            analysis.append(f"Available cash: {liquid_cash}, Required: {cost}.")
            
    elif payment_mode == "emi":
        estimated_emi = (cost * 1.1) / emi_months # Rough 10% interest assumption
        new_surplus = surplus - estimated_emi
        
        if new_surplus >= (monthly_income * 0.1): # Ensure at least 10% buffer
            can_afford = True
            status_color = "green"
            analysis.append(f"Yes, you can afford the estimated EMI of ~{round(estimated_emi)}/mo.")
            analysis.append(f"Your monthly surplus will reduce to {round(new_surplus)}, which is still healthy.")
        elif new_surplus > 0:
            can_afford = True
            status_color = "yellow"
            analysis.append(f"You can barely afford this EMI (~{round(estimated_emi)}/mo).")
            analysis.append(f"Your monthly surplus will be squeezed to just {round(new_surplus)}, leaving no room for emergencies.")
        else:
            can_afford = False
            status_color = "red"
            analysis.append(f"No, taking this on EMI will put your monthly cash flow in the negative!")
            analysis.append(f"Estimated EMI is ~{round(estimated_emi)}/mo, but your current surplus is only {surplus}.")

    return {
        "item_name": item_name,
        "cost": cost,
        "can_afford": can_afford,
        "status_color": status_color,
        "analysis": analysis,
        "metrics": {
            "liquid_cash_before": liquid_cash,
            "liquid_cash_after": liquid_cash - cost if payment_mode == "upfront" else liquid_cash,
            "surplus_before": surplus,
            "surplus_after": surplus - ((cost*1.1)/emi_months) if payment_mode == "emi" else surplus
        }
    }
