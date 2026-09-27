"""
Demo router -- simulation endpoints for product demos and testing.

These endpoints allow seeding data, simulating transactions, and
triggering alerts without real-world side effects.
"""

from __future__ import annotations

import logging
import random
from datetime import date, datetime, timedelta

from fastapi import APIRouter

from models import db
from models.schemas import (
    DemoResetRequest,
    DemoSimulateCollection,
    DemoSimulatePayment,
    DemoTriggerAlert,
    TransactionType,
    UdhariStatus,
)
from services import realtime

logger = logging.getLogger(__name__)
router = APIRouter()

# Realistic Indian Personal Finance demo data
_DEMO_CATEGORIES_INCOME = ["Salary", "Freelance", "Investment Returns", "Rental Income"]
_DEMO_CATEGORIES_EXPENSE = ["Groceries", "Rent", "Utilities", "Transport", "Dining Out", "Entertainment", "EMI", "Shopping", "Medical"]
_DEMO_PARTIES = [
    ("Company XYZ", "9876543210"),
    ("Amazon", "9812345678"),
    ("BigBasket", "9988776655"),
    ("HDFC Bank", "9123456789"),
    ("Zomato", "9234567890"),
    ("Swiggy", "9345678901"),
    ("Landlord", "9456789012"),
    ("Netflix", "9567890123"),
]


@router.post("/reset")
async def reset_demo(body: DemoResetRequest):
    """
    Reset the demo merchant's data and seed with fresh realistic entries.

    Creates 30 days of transaction history, a few udhari entries,
    customers, and employees.
    """
    merchant_id = body.merchant_id
    logger.info("Resetting demo data for merchant: %s", merchant_id)

    # Ensure demo merchant exists (vital for fresh Supabase projects)
    try:
        existing_merchant = db.select("merchants", filters={"id": merchant_id})
        if not existing_merchant:
            db.insert("merchants", {
                "id": merchant_id,
                "name": "Demo User",
                "owner_name": "Demo Owner",
                "phone": "+919999999999",
                "business_type": "individual",
            })
    except Exception as e:
        logger.error("Failed to insert demo merchant: %s", e)

    # Clear existing data (order matters due to potential FK constraints)
    for table in ["transactions", "udhari", "customers", "employees", "whatsapp_messages", "briefings"]:
        try:
            existing = db.select(table, filters={"merchant_id": merchant_id})
            for row in existing:
                db.delete(table, row["id"])
        except Exception:
            logger.debug("Could not clear %s for demo reset", table)

    # Seed transactions for last 30 days
    transactions_created = 0
    for day_offset in range(30, 0, -1):
        d = (date.today() - timedelta(days=day_offset)).isoformat()
        num_txns = random.randint(1, 4)

        for _ in range(num_txns):
            # 10% chance of income, mostly expenses
            is_income = random.random() < 0.1
            if is_income:
                amount = random.choice([5000, 10000, 50000, 80000, 100000])
                category = random.choice(_DEMO_CATEGORIES_INCOME)
                party = random.choice(_DEMO_PARTIES)
                db.insert("transactions", {
                    "merchant_id": merchant_id,
                    "amount": amount,
                    "type": TransactionType.INCOME.value,
                    "category": category,
                    "customer_name": party[0],
                    "recorded_at": d,
                    "source": "demo",
                })
            else:
                amount = random.choice([200, 500, 1000, 2000, 5000, 10000])
                category = random.choice(_DEMO_CATEGORIES_EXPENSE)
                party = random.choice(_DEMO_PARTIES)
                db.insert("transactions", {
                    "merchant_id": merchant_id,
                    "amount": amount,
                    "type": TransactionType.EXPENSE.value,
                    "category": category,
                    "customer_name": party[0],
                    "recorded_at": d,
                    "source": "demo",
                })
            transactions_created += 1

    # Seed entities (parties)
    customers_created = 0
    for name, phone in _DEMO_PARTIES:
        db.insert("customers", {
            "merchant_id": merchant_id,
            "name": name,
            "phone": phone,
            "total_visits": random.randint(5, 50),
            "total_spent": random.randint(5000, 100000),
            "last_visit": (date.today() - timedelta(days=random.randint(0, 45))).isoformat(),
            "rfm_segment": random.choice(["regular", "vip", "occasional"]),
        })
        customers_created += 1

    # Seed udharis (debt obligations)
    udharis_created = 0
    demo_debts = [
        ("HDFC Credit Card", "9876543211", 45000),
        ("SBI Home Loan", "9876543212", 2500000),
        ("Personal Loan", "9876543213", 150000),
        ("Friend Rahul", "9876543214", 5000),
    ]
    for name, phone, amount in demo_debts:
        status = random.choice(["pending", "pending", "overdue", "partial"])
        paid = random.randint(0, amount // 2) if status == "partial" else 0
        db.insert("udhari", {
            "merchant_id": merchant_id,
            "debtor_name": name,
            "debtor_phone": phone,
            "amount": amount,
            "amount_paid": paid,
            "status": status,
            "notes": "Demo debt",
            "due_date": (date.today() - timedelta(days=random.randint(-10, 20))).isoformat(),
        })
        udharis_created += 1

    await realtime.emit_dashboard_refresh(merchant_id)

    return {
        "status": "reset_complete",
        "merchant_id": merchant_id,
        "seeded": {
            "transactions": transactions_created,
            "customers": customers_created,
            "udhari": udharis_created,
        },
    }


@router.post("/simulate-payment")
async def simulate_payment(body: DemoSimulatePayment):
    """Simulate an incoming payment (income transaction) with real-time update."""
    txn = db.insert("transactions", {
        "merchant_id": body.merchant_id,
        "amount": body.amount,
        "type": TransactionType.INCOME.value,
        "category": body.category,
        "customer_name": body.party_name,
        "recorded_at": datetime.now().isoformat(),
        "source": "demo_simulation",
    })

    await realtime.emit_transaction_created(body.merchant_id, txn)
    await realtime.emit_dashboard_refresh(body.merchant_id)

    return {"simulated": True, "transaction": txn}


@router.post("/simulate-collection")
async def simulate_collection(body: DemoSimulateCollection):
    """
    Simulate an udhari collection.  If udhari_id is given, partially settles
    that entry.  Otherwise picks a random pending udhari.
    """
    merchant_id = body.merchant_id

    if body.udhari_id:
        udhari = db.select("udhari", filters={"id": body.udhari_id}, single=True)
    else:
        udharis = db.get_merchant_udharis(merchant_id, status="pending")
        if not udharis:
            return {"simulated": False, "reason": "No pending udharis found."}
        udhari = random.choice(udharis)

    if not udhari:
        return {"simulated": False, "reason": "Udhari not found."}

    settle_amount = min(body.amount, udhari.get("remaining", body.amount))
    new_paid = udhari.get("amount_paid", 0) + settle_amount
    new_remaining = max(0, udhari["amount"] - new_paid)
    new_status = UdhariStatus.SETTLED.value if new_remaining == 0 else UdhariStatus.PARTIAL.value

    updated = db.update("udhari", udhari["id"], {
        "amount_paid": new_paid,
        "status": new_status,
    })

    # Also record income
    db.insert("transactions", {
        "merchant_id": merchant_id,
        "amount": settle_amount,
        "type": TransactionType.INCOME.value,
        "category": "Udhari Collection",
        "customer_name": udhari.get("debtor_name"),
        "recorded_at": datetime.now().isoformat(),
        "source": "demo_simulation",
    })

    await realtime.emit_udhari_settled(merchant_id, updated)
    await realtime.emit_dashboard_refresh(merchant_id)

    return {"simulated": True, "udhari": updated, "amount_collected": settle_amount}


@router.post("/trigger-alert")
async def trigger_alert(body: DemoTriggerAlert):
    """Trigger a simulated proactive alert for demo purposes."""
    alert_messages = {
        "cash_crunch": {
            "type": "cash_crunch",
            "severity": "critical",
            "title": "Cash Crunch Warning",
            "message": "Next 7 days mein cash ki kami ho sakti hai due to upcoming EMIs.",
            "recommendation": "Review discretionary expenses immediately.",
        },
        "revenue_drop": {
            "type": "revenue_drop",
            "severity": "warning",
            "title": "Savings Drop Detected",
            "message": "Pichle mahine se savings 35% kam hui hai.",
            "recommendation": "Try to stick to the 50/30/20 rule.",
        },
        "overdue_udhari": {
            "type": "overdue_udhari",
            "severity": "warning",
            "title": "Credit Card Bill Alert",
            "message": "HDFC Credit card bill Rs 15,000 overdue ho gaya hai.",
            "recommendation": "Pay minimum due immediately to avoid penalties.",
        },
        "expense_spike": {
            "type": "expense_spike",
            "severity": "info",
            "title": "Expense Spike",
            "message": "Is hafte 'Dining Out' mein normal se 40% zyada kharcha hua hai.",
            "recommendation": "Avoid ordering outside food for the next few days.",
        },
    }

    alert = alert_messages.get(body.alert_type, alert_messages["cash_crunch"])

    await realtime.emit_alert(body.merchant_id, alert)

    return {"triggered": True, "alert": alert}
