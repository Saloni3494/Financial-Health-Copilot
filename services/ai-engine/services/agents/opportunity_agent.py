import logging
from typing import List, Dict, Any
from datetime import datetime, date, timedelta
import json

from models import db
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

def generate_deterministic_opportunities(merchant_id: str) -> List[Dict[str, Any]]:
    """Generate opportunities deterministically based on business rules and economics."""
    opps = []
    today = date.today()
    
    # 1. Pending Debt Recovery / EMI Reminders
    try:
        udharis = db.get_merchant_udharis(merchant_id, status="pending")
        for u in udharis:
            amount = u.get("remaining") or 0
            if amount > 0:
                due_date_str = u.get("due_date")
                days_overdue = 15
                if due_date_str:
                    try:
                        days_overdue = (today - date.fromisoformat(due_date_str[:10])).days
                    except:
                        pass
                
                # If it's overdue or due soon, create an opp
                if days_overdue > -7:  
                    risk_score = min(100, max(0, days_overdue * 2))
                    risk_level = "High" if risk_score > 60 else "Medium" if risk_score > 30 else "Low"
                    
                    opps.append({
                        "type": "debt_recovery",
                        "priority": "high" if amount > 5000 else "medium",
                        "estimated_impact": float(amount),
                        "confidence": max(10, 100 - risk_score),
                        "economic_breakdown": {
                            "expected_revenue": float(amount),
                            "expected_profit": float(amount),
                            "cash_required": 0.0,
                            "risk": risk_level,
                            "evidence": f"Pending debt of Rs {amount} with {u.get('debtor_name')}. Due {'in' if days_overdue < 0 else 'ago'} {abs(days_overdue)} days.",
                            "assumptions": "Recovering this directly improves available cash flow."
                        }
                    })
    except Exception as e:
        logger.warning(f"Error generating udhari opps: {e}")

    # 2. Savings & Investments (Surplus Detection)
    try:
        # Check last 30 days of transactions for surplus
        txns = db.select("transactions", filters={"merchant_id": merchant_id})
        income = sum(t["amount"] for t in txns if t["type"] == "income")
        expense = sum(t["amount"] for t in txns if t["type"] == "expense")
        surplus = income - expense
        
        if surplus > 10000:
            opps.append({
                "type": "savings_increase",
                "priority": "high",
                "estimated_impact": float(surplus * 0.5), # suggest saving 50% of surplus
                "confidence": 90,
                "economic_breakdown": {
                    "expected_revenue": float(surplus * 0.5 * 0.12), # 12% returns
                    "expected_profit": float(surplus * 0.5 * 0.12),
                    "cash_required": float(surplus * 0.5),
                    "risk": "Low",
                    "evidence": f"You have a cash surplus of Rs {surplus:.2f} this month.",
                    "assumptions": "Investing 50% of this surplus in an Index Fund/FD could yield 12% annualized returns."
                }
            })
    except Exception as e:
        logger.warning(f"Error generating savings opps: {e}")
        
    # 3. High Expense Reduction
    try:
        if txns:
            # Group expenses by category
            categories = {}
            for t in txns:
                if t["type"] == "expense":
                    cat = t.get("category", "Other")
                    categories[cat] = categories.get(cat, 0) + t["amount"]
                    
            if categories:
                top_cat = max(categories.items(), key=lambda x: x[1])
                if top_cat[1] > 5000 and top_cat[0] not in ["Rent", "EMI"]:
                    opps.append({
                        "type": "expense_reduction",
                        "priority": "medium",
                        "estimated_impact": float(top_cat[1] * 0.2), # target 20% reduction
                        "confidence": 75,
                        "economic_breakdown": {
                            "expected_revenue": float(top_cat[1] * 0.2),
                            "expected_profit": float(top_cat[1] * 0.2),
                            "cash_required": 0.0,
                            "risk": "Medium",
                            "evidence": f"High spending detected in {top_cat[0]} category (Rs {top_cat[1]:.2f}).",
                            "assumptions": f"Reducing {top_cat[0]} expenses by 20% directly increases your monthly savings."
                        }
                    })
    except Exception as e:
        logger.warning(f"Error generating expense opps: {e}")

    # (Inventory and Customer Winback removed for Personal Finance Copilot)

    # Sort and pick top 5
    opps.sort(key=lambda x: x["estimated_impact"], reverse=True)
    return opps[:5]


async def discover_opportunities(merchant_id: str) -> List[Dict[str, Any]]:
    """
    Run the Economic Opportunity Discovery Engine.
    1. Generate opportunities deterministically with economic breakdowns.
    2. Use Groq to add contextual reasoning/explanation.
    3. Deduplicate and persist to DB.
    """
    deterministic_opps = generate_deterministic_opportunities(merchant_id)
    
    if not deterministic_opps:
        logger.info(f"Not enough data to generate opportunities for {merchant_id}")
        return []

    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.groq_api_key)
        
        from services.agents.memory_agent import generate_memory_context
        memory_context = generate_memory_context(merchant_id)
        
        prompt = f"""
You are an expert Personal Financial Advisor. 
I have deterministically calculated the economics for these highly actionable opportunities to improve the user's financial health:

{json.dumps(deterministic_opps, indent=2)}

IMPORTANT - HISTORICAL USER MEMORY (Growth Memory):
The user has the following personalized historical insights based on actual impact measurements. Use these to adjust your reasoning and recommendations so they are highly personalized. Do not contradict these insights.
---
{memory_context}
---

For each opportunity in the list, add the following presentation fields:
- "title": A short catchy title in English/Hinglish.
- "reason": A persuasive explanation of WHY they should do this, referencing the evidence and the expected financial benefit.
- "action_type": Choose one of "debt_recovery" | "savings_increase" | "expense_reduction"
- "recommended_action": What exact action should the user take? (e.g., "Follow up for pending money")

Return ONLY a JSON array of objects. The objects must include ALL the original fields from the input (including the full 'economic_breakdown') PLUS your 4 new fields.
Do not output anything outside of the JSON array.
"""
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": "You are a helpful personal finance advisor returning strict JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        opportunities = json.loads(content.strip())
        
        # Validate and structure
        valid_opps = []
        for opp in opportunities:
            if all(k in opp for k in ["type", "title", "reason", "priority", "estimated_impact", "economic_breakdown"]):
                db_opp = {
                    "merchant_id": merchant_id,
                    "type": opp["type"],
                    "title": opp["title"],
                    "reason": opp["reason"],
                    "priority": opp["priority"],
                    "estimated_impact": opp["estimated_impact"],
                    "confidence": opp.get("confidence", 80),
                    "action_type": opp.get("action_type"),
                    "recommended_action": opp.get("recommended_action"),
                    "status": "open",
                    "metadata": {
                        "economic_breakdown": opp["economic_breakdown"]
                    }
                }
                valid_opps.append(db_opp)
                
        # Deduplicate and Persist
        saved_opps = _deduplicate_and_save(merchant_id, valid_opps)
        return saved_opps
        
    except Exception as e:
        logger.error(f"Error generating opportunities: {e}")
        return []

def _deduplicate_and_save(merchant_id: str, new_opps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Save new opportunities, avoiding duplicates of the same type that are already open."""
    try:
        existing = db.select("opportunities", filters={"merchant_id": merchant_id, "status": "open"})
        existing_types = {e["type"]: e["id"] for e in existing}
        
        saved = []
        for opp in new_opps:
            opp_type = opp["type"]
            if opp_type in existing_types:
                # Update existing opportunity
                opp_id = existing_types[opp_type]
                db.update("opportunities", opp_id, {
                    "title": opp["title"],
                    "reason": opp["reason"],
                    "priority": opp["priority"],
                    "estimated_impact": opp["estimated_impact"],
                    "confidence": opp.get("confidence", 80),
                    "action_type": opp.get("action_type"),
                    "recommended_action": opp.get("recommended_action"),
                    "metadata": opp.get("metadata", {})
                })
                opp["id"] = opp_id
                saved.append(opp)
            else:
                # Insert new opportunity
                inserted = db.insert("opportunities", opp)
                saved.append(inserted)
        
        return saved
    except Exception as e:
        logger.error(f"Database error saving opportunities: {e}")
        return []
