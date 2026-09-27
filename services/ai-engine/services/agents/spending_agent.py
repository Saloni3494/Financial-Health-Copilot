"""
Financial Health Copilot Spending Intelligence Agent

Infers spending patterns and obligations from transaction patterns:
1. Detect category-wise spending trends
2. Detect unusual spending spikes
3. Identify recurring financial obligations (subscriptions, bills)
4. Generate Hindi recommendations with expected quantified impacts
"""

import logging
from collections import defaultdict
from datetime import datetime, date, timedelta
from typing import Optional

from groq import AsyncGroq

from config import get_settings
from models import db

logger = logging.getLogger(__name__)
settings = get_settings()

SPENDING_RECOMMENDATION_PROMPT = """You are the AI Financial Health Copilot.

Your task: Generate a concise English recommendation based on the spending analysis.

RULES:
1. Use clear, conversational English.
2. Be specific — mention categories, amounts
3. Be actionable — tell the user EXACTLY what to do
4. Keep each recommendation under 50 words
5. Format strictly using expected impact. E.g.: "⚠️ Recommendation: ... \n📈 EXPECTED IMPACT: ..."

Generate ONLY the recommendation list. One per line/block."""

async def analyze_spending(merchant_id: str, transactions: list[dict]) -> dict:
    """Analyze transaction patterns to infer spending intelligence."""
    today = date.today()
    expenses = [t for t in transactions if t.get("type") == "expense"]

    # 1. Trends
    trends = _analyze_demand_trends(expenses, today)
    
    # 2. Unusual spikes
    spikes = _detect_unusual_spending(expenses, today)

    # 3. Recurring
    recurring = _detect_recurring(expenses)

    return {
        "merchant_id": merchant_id,
        "trends": trends,
        "spikes": spikes,
        "recurring": recurring,
        "summary": {
            "total_categories": len(set(t.get("category", "") for t in expenses)),
            "spike_count": len(spikes),
            "recurring_count": len(recurring)
        },
        "analyzed_at": datetime.now().isoformat(),
    }


def _group_transactions(transactions: list[dict], key: str = "category") -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for txn in transactions:
        group_key = txn.get(key, "unknown") or "unknown"
        groups[group_key].append(txn)
    return dict(groups)

def _parse_date(d) -> Optional[date]:
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, str):
        try:
            return date.fromisoformat(d[:10])
        except ValueError:
            return None
    return None

def _analyze_demand_trends(expenses: list[dict], today: date) -> list[dict]:
    groups = _group_transactions(expenses, key="category")
    trends = []
    cutoff = today - timedelta(days=30)

    for category, txns in groups.items():
        if not category or category == "unknown":
            continue
        recent = [t for t in txns if _parse_date(t.get("date")) and _parse_date(t.get("date")) >= cutoff]
        older = [t for t in txns if _parse_date(t.get("date")) and _parse_date(t.get("date")) < cutoff]

        recent_total = sum(t.get("amount", 0) for t in recent)
        older_total = sum(t.get("amount", 0) for t in older)

        if older:
            older_dates = [_parse_date(t.get("date")) for t in older if _parse_date(t.get("date"))]
            older_span = max(1, (max(older_dates) - min(older_dates)).days) if older_dates else 1
            older_normalized = (older_total / older_span) * 30
        else:
            older_normalized = older_total

        if older_normalized > 0:
            change_pct = ((recent_total - older_normalized) / older_normalized) * 100
        else:
            change_pct = 100 if recent_total > 0 else 0

        if change_pct > 15:
            trend = "increasing"
        elif change_pct < -15:
            trend = "decreasing"
        else:
            trend = "stable"

        trends.append({
            "category": category,
            "recent_30d": round(recent_total, 2),
            "previous_period_normalized": round(older_normalized, 2),
            "change_percent": round(change_pct, 1),
            "trend": trend,
        })
    trends.sort(key=lambda t: abs(t["change_percent"]), reverse=True)
    return trends

def _detect_unusual_spending(expenses: list[dict], today: date) -> list[dict]:
    groups = _group_transactions(expenses, key="category")
    spikes = []
    for category, txns in groups.items():
        if len(txns) < 3:
            continue
        amounts = [t.get("amount", 0) for t in txns]
        avg = sum(amounts) / len(amounts)
        recent_txns = [t for t in txns if _parse_date(t.get("date")) and (today - _parse_date(t.get("date"))).days <= 7]
        for rt in recent_txns:
            amt = rt.get("amount", 0)
            if amt > avg * 1.5:
                spikes.append({
                    "category": category,
                    "date": rt.get("date"),
                    "amount": amt,
                    "avg": avg,
                    "reason": f"Unusually large expense in {category}"
                })
    return spikes

def _detect_recurring(expenses: list[dict]) -> list[dict]:
    groups = _group_transactions(expenses, key="party_name")
    recurring = []
    for party, txns in groups.items():
        if len(txns) >= 2 and party and party != "unknown":
            dates = sorted([_parse_date(t.get("date")) for t in txns if _parse_date(t.get("date"))])
            if len(dates) >= 2:
                gaps = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
                avg_gap = sum(gaps) / len(gaps)
                if 25 <= avg_gap <= 35:
                    avg_amt = sum(t.get("amount", 0) for t in txns) / len(txns)
                    recurring.append({
                        "party_name": party,
                        "type": "Monthly",
                        "avg_amount": avg_amt
                    })
    return recurring

async def generate_spending_recommendations(merchant_id: str) -> list[str]:
    ninety_days_ago = (date.today() - timedelta(days=90)).isoformat()
    try:
        transactions = db.select_range(
            "transactions",
            filters={"merchant_id": merchant_id},
            gte=("date", ninety_days_ago),
            lte=("date", date.today().isoformat()),
        )
    except Exception as e:
        logger.error("Failed to fetch transactions for spending logic: %s", e)
        return ["Data load error."]

    if not transactions:
        return ["No transaction data available yet."]

    analysis = await analyze_spending(merchant_id, transactions)
    
    recs = []
    for spike in analysis.get("spikes", [])[:2]:
        recs.append(f"⚠️ Unusually high expense in {spike['category']} (Rs {spike['amount']:,.0f}).\n📈 EXPECTED IMPACT: Limit this to save Rs {(spike['amount'] - spike['avg']):,.0f}.")
    
    for trend in analysis.get("trends", []):
        if trend["trend"] == "increasing":
            impact = trend["recent_30d"] - trend["previous_period_normalized"]
            recs.append(f"🔶 Spending in {trend['category']} is increasing (+{trend['change_percent']:.0f}%).\n📈 EXPECTED IMPACT: Control this to save Rs {impact:,.0f} per month.")
            break
            
    if not recs:
        recs.append("✅ Spending patterns are stable.\n📈 EXPECTED IMPACT: Continue this to maintain healthy cash flow.")
        
    return recs
