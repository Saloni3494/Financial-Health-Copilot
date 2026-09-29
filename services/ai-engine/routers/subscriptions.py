import json
import os
import logging
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

SUBSCRIPTIONS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "subscriptions.json")

def load_subscriptions() -> Dict[str, List[Dict[str, Any]]]:
    if not os.path.exists(SUBSCRIPTIONS_FILE):
        return {}
    try:
        with open(SUBSCRIPTIONS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading subscriptions: {e}")
        return {}

def save_subscriptions(data: Dict[str, List[Dict[str, Any]]]):
    os.makedirs(os.path.dirname(SUBSCRIPTIONS_FILE), exist_ok=True)
    with open(SUBSCRIPTIONS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/{merchant_id}")
async def get_subscriptions(merchant_id: str):
    """Get all recurring payments and subscriptions for a user."""
    data = load_subscriptions()
    
    if merchant_id not in data:
        seed_data = [
            {
                "id": f"sub-{uuid.uuid4().hex[:8]}",
                "name": "Netflix Premium",
                "category": "entertainment",
                "amount": 649,
                "billing_cycle": "monthly",
                "next_billing_date": "2026-10-15",
                "status": "active"
            },
            {
                "id": f"sub-{uuid.uuid4().hex[:8]}",
                "name": "Gym Membership",
                "category": "health",
                "amount": 2500,
                "billing_cycle": "monthly",
                "next_billing_date": "2026-10-01",
                "status": "active"
            },
            {
                "id": f"sub-{uuid.uuid4().hex[:8]}",
                "name": "Amazon Prime",
                "category": "shopping",
                "amount": 1499,
                "billing_cycle": "yearly",
                "next_billing_date": "2027-05-20",
                "status": "active"
            }
        ]
        data[merchant_id] = seed_data
        save_subscriptions(data)
        
    return {"subscriptions": data.get(merchant_id, [])}

@router.post("/{merchant_id}")
async def add_subscription(merchant_id: str, payload: dict):
    """Add a new subscription or recurring payment."""
    data = load_subscriptions()
    if merchant_id not in data:
        data[merchant_id] = []
        
    new_sub = {
        "id": f"sub-{uuid.uuid4().hex[:8]}",
        "name": payload.get("name", ""),
        "category": payload.get("category", "other"),
        "amount": float(payload.get("amount", 0)),
        "billing_cycle": payload.get("billing_cycle", "monthly"),
        "next_billing_date": payload.get("next_billing_date", ""),
        "status": payload.get("status", "active")
    }
    
    data[merchant_id].append(new_sub)
    save_subscriptions(data)
    
    return {"status": "success", "subscription": new_sub}
