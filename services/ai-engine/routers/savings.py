import json
import os
import logging
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

SAVINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "savings.json")

def load_savings() -> Dict[str, Dict[str, Any]]:
    if not os.path.exists(SAVINGS_FILE):
        return {}
    try:
        with open(SAVINGS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading savings: {e}")
        return {}

def save_savings(data: Dict[str, Dict[str, Any]]):
    os.makedirs(os.path.dirname(SAVINGS_FILE), exist_ok=True)
    with open(SAVINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/{merchant_id}")
async def get_savings(merchant_id: str):
    """Get savings behavior and goals for a user."""
    data = load_savings()
    
    if merchant_id not in data:
        seed_data = {
            "monthly_income": 120000,
            "monthly_expenses": 85000,
            "savings_rate": 29.1,
            "goals": [
                {
                    "id": f"goal-{uuid.uuid4().hex[:8]}",
                    "name": "Emergency Fund",
                    "target_amount": 500000,
                    "current_amount": 250000,
                    "deadline": "2027-01-01",
                    "category": "safety"
                },
                {
                    "id": f"goal-{uuid.uuid4().hex[:8]}",
                    "name": "Europe Vacation",
                    "target_amount": 300000,
                    "current_amount": 75000,
                    "deadline": "2027-06-15",
                    "category": "travel"
                }
            ]
        }
        data[merchant_id] = seed_data
        save_savings(data)
        
    return {"savings": data.get(merchant_id, {})}

@router.post("/{merchant_id}/goals")
async def add_goal(merchant_id: str, payload: dict):
    """Add a new savings goal."""
    data = load_savings()
    if merchant_id not in data:
        data[merchant_id] = {"monthly_income": 0, "monthly_expenses": 0, "savings_rate": 0, "goals": []}
        
    new_goal = {
        "id": f"goal-{uuid.uuid4().hex[:8]}",
        "name": payload.get("name", ""),
        "target_amount": float(payload.get("target_amount", 0)),
        "current_amount": float(payload.get("current_amount", 0)),
        "deadline": payload.get("deadline", ""),
        "category": payload.get("category", "general")
    }
    
    data[merchant_id]["goals"].append(new_goal)
    save_savings(data)
    
    return {"status": "success", "goal": new_goal}

@router.post("/{merchant_id}/update_rate")
async def update_rate(merchant_id: str, payload: dict):
    """Update base monthly income/expense for savings rate calc."""
    data = load_savings()
    if merchant_id not in data:
        data[merchant_id] = {"monthly_income": 0, "monthly_expenses": 0, "savings_rate": 0, "goals": []}
        
    inc = float(payload.get("monthly_income", data[merchant_id].get("monthly_income", 0)))
    exp = float(payload.get("monthly_expenses", data[merchant_id].get("monthly_expenses", 0)))
    
    rate = ((inc - exp) / inc * 100) if inc > 0 else 0
    
    data[merchant_id]["monthly_income"] = inc
    data[merchant_id]["monthly_expenses"] = exp
    data[merchant_id]["savings_rate"] = round(rate, 2)
    
    save_savings(data)
    return {"status": "success", "savings": data[merchant_id]}
