import json
import os
import logging
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

LOANS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "loans.json")

def load_loans() -> Dict[str, List[Dict[str, Any]]]:
    if not os.path.exists(LOANS_FILE):
        return {}
    try:
        with open(LOANS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading loans: {e}")
        return {}

def save_loans(data: Dict[str, List[Dict[str, Any]]]):
    os.makedirs(os.path.dirname(LOANS_FILE), exist_ok=True)
    with open(LOANS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/{merchant_id}")
async def get_loans(merchant_id: str):
    """Get all loans and debt obligations for a user."""
    data = load_loans()
    
    if merchant_id not in data:
        seed_data = [
            {
                "id": f"loan-{uuid.uuid4().hex[:8]}",
                "name": "SBI Home Loan",
                "type": "home_loan",
                "principal": 5000000,
                "outstanding": 4250000,
                "emi_amount": 42000,
                "interest_rate": 8.5,
                "next_due_date": "2026-10-05"
            },
            {
                "id": f"loan-{uuid.uuid4().hex[:8]}",
                "name": "HDFC Car Loan",
                "type": "car_loan",
                "principal": 800000,
                "outstanding": 320000,
                "emi_amount": 16500,
                "interest_rate": 9.2,
                "next_due_date": "2026-10-10"
            },
            {
                "id": f"loan-{uuid.uuid4().hex[:8]}",
                "name": "Borrowed from Rahul",
                "type": "personal",
                "principal": 50000,
                "outstanding": 25000,
                "emi_amount": 0,
                "interest_rate": 0,
                "next_due_date": "2026-11-01"
            }
        ]
        data[merchant_id] = seed_data
        save_loans(data)
        
    return {"loans": data.get(merchant_id, [])}

@router.post("/{merchant_id}")
async def add_loan(merchant_id: str, payload: dict):
    """Add a new loan."""
    data = load_loans()
    if merchant_id not in data:
        data[merchant_id] = []
        
    new_loan = {
        "id": f"loan-{uuid.uuid4().hex[:8]}",
        "name": payload.get("name", ""),
        "type": payload.get("type", "personal"),
        "principal": float(payload.get("principal", 0)),
        "outstanding": float(payload.get("outstanding", 0)),
        "emi_amount": float(payload.get("emi_amount", 0)),
        "interest_rate": float(payload.get("interest_rate", 0)),
        "next_due_date": payload.get("next_due_date", "")
    }
    
    data[merchant_id].append(new_loan)
    save_loans(data)
    
    return {"status": "success", "loan": new_loan}
