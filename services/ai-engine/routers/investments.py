import json
import os
import logging
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

INVESTMENTS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "investments.json")

def load_investments() -> Dict[str, List[Dict[str, Any]]]:
    if not os.path.exists(INVESTMENTS_FILE):
        return {}
    try:
        with open(INVESTMENTS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading investments: {e}")
        return {}

def save_investments(data: Dict[str, List[Dict[str, Any]]]):
    os.makedirs(os.path.dirname(INVESTMENTS_FILE), exist_ok=True)
    with open(INVESTMENTS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/{merchant_id}")
async def get_investments(merchant_id: str):
    """Get all investments for a user."""
    data = load_investments()
    
    if merchant_id not in data:
        seed_data = [
            {
                "id": f"inv-{uuid.uuid4().hex[:8]}",
                "name": "Nifty 50 Index Fund",
                "type": "mutual_fund",
                "invested_amount": 50000,
                "current_value": 62500,
                "monthly_sip": 5000
            },
            {
                "id": f"inv-{uuid.uuid4().hex[:8]}",
                "name": "HDFC Fixed Deposit",
                "type": "fixed_deposit",
                "invested_amount": 100000,
                "current_value": 107500,
                "monthly_sip": 0
            },
            {
                "id": f"inv-{uuid.uuid4().hex[:8]}",
                "name": "Digital Gold",
                "type": "gold",
                "invested_amount": 15000,
                "current_value": 16200,
                "monthly_sip": 0
            }
        ]
        data[merchant_id] = seed_data
        save_investments(data)
        
    return {"investments": data.get(merchant_id, [])}

@router.post("/{merchant_id}")
async def add_investment(merchant_id: str, payload: dict):
    """Add a new investment."""
    data = load_investments()
    if merchant_id not in data:
        data[merchant_id] = []
        
    new_inv = {
        "id": f"inv-{uuid.uuid4().hex[:8]}",
        "name": payload.get("name", ""),
        "type": payload.get("type", "mutual_fund"),
        "invested_amount": float(payload.get("invested_amount", 0)),
        "current_value": float(payload.get("current_value", 0)),
        "monthly_sip": float(payload.get("monthly_sip", 0))
    }
    
    data[merchant_id].append(new_inv)
    save_investments(data)
    
    return {"status": "success", "investment": new_inv}
