import json
import os
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

ACCOUNTS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "accounts.json")

class AccountCreate(BaseModel):
    name: str
    type: str # "bank_account", "credit_card", "loan", "investment"
    balance: float
    credit_limit: float = 0.0
    apr: float = 0.0

def load_accounts() -> Dict[str, List[Dict[str, Any]]]:
    if not os.path.exists(ACCOUNTS_FILE):
        return {}
    try:
        with open(ACCOUNTS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading accounts: {e}")
        return {}

def save_accounts(data: Dict[str, List[Dict[str, Any]]]):
    os.makedirs(os.path.dirname(ACCOUNTS_FILE), exist_ok=True)
    with open(ACCOUNTS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/{merchant_id}")
async def get_accounts(merchant_id: str):
    """Get all bank accounts, credit cards, and investments for a user."""
    data = load_accounts()
    
    # If the user has no accounts yet, provide some seed data for the demo
    if merchant_id not in data:
        seed_data = [
            {"id": "acc-1", "name": "HDFC Checking", "type": "bank_account", "balance": 45000, "credit_limit": 0},
            {"id": "acc-2", "name": "SBI Savings", "type": "bank_account", "balance": 150000, "credit_limit": 0},
            {"id": "acc-3", "name": "ICICI Credit Card", "type": "credit_card", "balance": -12500, "credit_limit": 50000, "apr": 42.0},
            {"id": "acc-4", "name": "Zerodha Mutual Funds", "type": "investment", "balance": 250000, "credit_limit": 0},
        ]
        data[merchant_id] = seed_data
        save_accounts(data)
        
    return {"accounts": data.get(merchant_id, [])}

@router.post("/{merchant_id}")
async def add_account(merchant_id: str, payload: AccountCreate):
    """Add a new account."""
    data = load_accounts()
    if merchant_id not in data:
        data[merchant_id] = []
        
    import uuid
    new_acc = {
        "id": f"acc-{uuid.uuid4().hex[:8]}",
        "name": payload.name,
        "type": payload.type,
        "balance": payload.balance,
        "credit_limit": payload.credit_limit,
        "apr": payload.apr
    }
    
    data[merchant_id].append(new_acc)
    save_accounts(data)
    
    return {"status": "success", "account": new_acc}
