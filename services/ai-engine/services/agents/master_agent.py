"""
FinSight AI Master Agent — LangGraph Multi-Agent Orchestration

The Master Agent is the "Muneem personality" that:
1. Receives NLU output (intent + entities)
2. Routes to the correct specialist agent
3. Coordinates multi-step workflows
4. Generates the final Hindi response
5. Manages approval gates (auto vs ask-merchant)

Constitutional AI Guardrails:
- RBI Fair Practices Code compliance for collection messages
- No threatening language in any communication
- Financial advice disclosures
- Data privacy compliance
"""

from typing import Optional
from groq import AsyncGroq

from config import get_settings

settings = get_settings()

# Financial Copilot personality prompt
FINANCIAL_COPILOT_PERSONALITY = """You are the AI Financial Health Copilot, an intelligent assistant designed to help individuals manage their personal finances, analyze spending patterns, and make proactive financial decisions.

PERSONALITY:
- You are analytical, objective, and highly structured.
- You provide clear, data-driven financial advice.
- You do not make up data; if data is missing, explicitly state what is missing and reduce your confidence.
- You speak purely in English.

CRITICAL RULE - YOU MUST STRICTLY FORMAT EVERY RESPONSE WITH THESE EXACT SECTIONS:

1. **OBSERVED FACT** 📊
(Must be directly supported by transaction/financial data provided in the context)

2. **MODEL PREDICTION** 🔮
(AI/model-generated forecast, inference, or trend analysis. Include your confidence level here)

3. **RECOMMENDATION** 💡
(A personalized, practical next action for the user to take)

4. **EXPECTED IMPACT** 📈
(A quantified before/after impact of taking the recommendation. e.g., "Expected Savings: Rs X", "Cash-flow impact: Rs Y")

If data is insufficient for a prediction or impact, explicitly state: "Data insufficient for precise calculation."

Do not mix facts, predictions, and recommendations. Keep them strictly in their respective sections."""


async def generate_response(
    intent: str,
    entities: dict,
    action_result: dict,
    merchant_name: str = "Sunita ji",
    context: dict = None,
) -> str:
    """
    Generate the Master Agent's English response after an action is completed.

    Args:
        intent: The classified intent
        entities: Extracted entities
        action_result: What the action router did (DB writes, calculations, etc.)
        merchant_name: Merchant's name for personalization
        context: Additional context (today's P&L, pending udhari, etc.)

    Returns:
        English response text for WhatsApp/TTS
    """
    context = context or {}

    context_str = ""
    if context:
        context_str = f"""
Current context:
- Today's income: Rs {context.get('today_income', 0):,.0f}
- Today's expense: Rs {context.get('today_expense', 0):,.0f}
- Today's profit: Rs {context.get('today_profit', 0):,.0f}
- Profit margin: {context.get('profit_margin', 0):.1f}%
- Pending udhari: Rs {context.get('total_udhari', 0):,.0f}
- PayScore: {context.get('payscore', 0)}
"""

    action_summary = ""
    if action_result:
        action_summary = f"""
Action taken:
- Type: {action_result.get('action_type', 'unknown')}
- Details: {action_result.get('description', '')}
- Amount: Rs {action_result.get('amount', 0):,.0f}
- Person: {action_result.get('person', '')}
"""

    user_message = f"""Intent: {intent}
Original voice command entities: {entities}

{action_summary}
{context_str}

Generate a response for {merchant_name} confirming the action and giving relevant context."""

    try:
        client = AsyncGroq(api_key=settings.groq_api_key)
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": FINANCIAL_COPILOT_PERSONALITY},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Master Agent Error: {e}")
        return _fallback_response(intent, entities, action_result)


def _fallback_response(intent: str, entities: dict, action_result: dict) -> str:
    """Fallback English responses when LLM is unavailable"""
    amount = entities.get("amount", 0)
    person = entities.get("person", "")

    fallbacks = {
        "CASH_RECEIVED": f"Income of Rs {amount:,.0f} logged. 💰",
        "EXPENSE_LOG": f"Expense of Rs {amount:,.0f} logged. 📝",
        "UDHARI_CREATE": f"Pending debt of Rs {amount:,.0f} for {person} logged. I will remind you. 📋",
        "UDHARI_SETTLE": f"{person} paid back Rs {amount:,.0f}! Debt settled. ✅",
        "QUERY_SUMMARY": "Today's summary is ready. Check the dashboard. 📊",
        "QUERY_PROFIT": "Profit calculation updated on the dashboard. 📈",
        "QUERY_EXPENSE": "Expense breakdown is on the dashboard. 📉",
        "COMMAND_REMIND": "Reminders sent! Payment links included. 📤",
        "COMMAND_GST": "GST status updated. Check the dashboard. 📋",
        "GENERAL": "Yes, I'm listening. How can I help you? 🙏",
    }
    return fallbacks.get(intent, "Noted. 👍")


async def generate_morning_briefing(
    merchant_name: str,
    yesterday_data: dict,
    alerts: list[str],
    payscore: int,
    udhari_due_today: list[dict],
    gst_status: dict = None,
) -> str:
    """
    Generate the daily morning WhatsApp briefing.

    This is the "digital muneem's" daily report to the merchant.
    """
    alerts_text = "\n".join(f"• {a}" for a in alerts) if alerts else "Koi special alert nahi hai aaj."

    udhari_text = ""
    if udhari_due_today:
        total_due = sum(u.get("remaining", u["amount"] - u.get("amount_paid", 0)) for u in udhari_due_today)
        names = ", ".join(u["debtor_name"] for u in udhari_due_today[:3])
        udhari_text = f"📝 {len(udhari_due_today)} udhari due hain aaj (Rs {total_due:,.0f}): {names}"
        if len(udhari_due_today) > 3:
            udhari_text += f" aur {len(udhari_due_today) - 3} aur"

    gst_text = ""
    if gst_status and gst_status.get("status") in ("pending", "ready"):
        days_left = gst_status.get("days_remaining", 0)
        gst_text = f"📋 GSTR-3B is due in {days_left} days — {gst_status.get('status', 'pending')}"

    prompt = f"""Generate a morning briefing WhatsApp message for {merchant_name}.

Yesterday's data:
- Income: Rs {yesterday_data.get('income', 0):,.0f}
- Expense: Rs {yesterday_data.get('expense', 0):,.0f}
- Profit: Rs {yesterday_data.get('profit', 0):,.0f}
- Margin: {yesterday_data.get('margin', 0):.1f}%
- Income change vs day before: {yesterday_data.get('income_change', 'N/A')}

Today's alerts:
{alerts_text}

Udhari due:
{udhari_text}

GST:
{gst_text}

PayScore: {payscore}

Format it as a WhatsApp message with emojis and clear sections. Keep it under 200 words.
End with an encouraging line and "Reply or send a voice note! 🎤" """

    try:
        client = AsyncGroq(api_key=settings.groq_api_key)
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": FINANCIAL_COPILOT_PERSONALITY},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=400,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Fallback static briefing
        return f"""Hello {merchant_name}! 🙏

Yesterday's Summary:
📈 Income: Rs {yesterday_data.get('income', 0):,.0f}
📉 Expense: Rs {yesterday_data.get('expense', 0):,.0f}
💰 Profit: Rs {yesterday_data.get('profit', 0):,.0f} ({yesterday_data.get('margin', 0):.0f}% margin)

Today's Alerts:
{alerts_text}

{udhari_text}
{gst_text}

Health Score: {payscore} 💳

Reply or send a voice note! 🎤"""


# ============================================
# INTENT ROUTING MAP
# ============================================

INTENT_ROUTING = {
    "CASH_RECEIVED": {
        "specialist": "action_router",
        "action": "create_income_transaction",
        "auto_approve": True,
    },
    "EXPENSE_LOG": {
        "specialist": "action_router",
        "action": "create_expense_transaction",
        "auto_approve": True,
    },
    "UDHARI_CREATE": {
        "specialist": "action_router",
        "action": "create_udhari",
        "auto_approve": True,
        "follow_up": "collection_agent",  # Schedule collection after creating
    },
    "UDHARI_SETTLE": {
        "specialist": "action_router",
        "action": "settle_udhari",
        "auto_approve": True,
        "follow_up": "payscore_agent",  # Recalculate score after collection
    },
    "QUERY_SUMMARY": {
        "specialist": "cashflow_agent",
        "action": "get_today_summary",
        "auto_approve": True,
    },
    "QUERY_PROFIT": {
        "specialist": "action_router",
        "action": "get_profit",
        "auto_approve": True,
    },
    "QUERY_EXPENSE": {
        "specialist": "action_router",
        "action": "get_expense_breakdown",
        "auto_approve": True,
    },
    "QUERY_CUSTOMER": {
        "specialist": "customer_agent",
        "action": "get_customer_info",
        "auto_approve": True,
    },
    "COMMAND_REMIND": {
        "specialist": "collection_agent",
        "action": "send_reminders",
        "auto_approve": False,  # Ask merchant before sending
    },
    "COMMAND_GST": {
        "specialist": "gst_agent",
        "action": "process_gst_command",
        "auto_approve": False,
    },
    "PAYMENT_TAG": {
        "specialist": "action_router",
        "action": "tag_last_payment",
        "auto_approve": True,
    },
    "SIMULATE_IMPACT": {
        "specialist": "action_router",
        "action": "simulate_impact",
        "auto_approve": True,
    },
    "QUERY_SPENDING": {
        "specialist": "action_router",
        "action": "query_spending",
        "auto_approve": True,
    },
    "GENERAL": {
        "specialist": "master_llm",
        "action": "conversational_response",
        "auto_approve": True,
    },
}


def get_routing(intent: str) -> dict:
    """Get the routing configuration for an intent"""
    return INTENT_ROUTING.get(intent, INTENT_ROUTING["GENERAL"])
