"""
FinSight AI Voice Call Agent for Udhari Collection

Makes automated Hindi voice calls to debtors using Twilio.
The AI speaks a culturally-aware Hindi message reminding the debtor
about their pending payment, and provides a Paytm payment link via SMS.

Flow:
1. FinSight AI decides to call a debtor (via Thompson Sampling RL)
2. Twilio initiates a call to the debtor's phone
3. Twilio plays a TTS message in Hindi (using Sarvam Bulbul or Twilio's Hindi voice)
4. After the call, sends a follow-up SMS/WhatsApp with the Paytm payment link
5. Tracks whether the debtor answered, listened, or hung up (reward signal for RL)

Twilio Free Trial:
- $15.50 free credit
- Get a test number at https://console.twilio.com
- Supports India calls + SMS
- Voice TTS in Hindi (basic) or use pre-recorded audio

Alternative (no Twilio):
- Use browser-based SpeechSynthesis for demo
- Show the call UI on screen instead of making a real call
"""

import logging
from typing import Optional
from datetime import datetime

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Twilio config (add to .env)
TWILIO_ACCOUNT_SID = ""  # From https://console.twilio.com
TWILIO_AUTH_TOKEN = ""
TWILIO_PHONE_NUMBER = ""  # Your Twilio number


async def make_collection_call(
    debtor_name: str,
    debtor_phone: str,
    amount: float,
    merchant_name: str = "Sunita Saree Shop",
    merchant_owner: str = "Sunita ji",
    payment_link: str = "",
    tone: str = "polite_follow_up",
) -> dict:
    """
    Make an automated voice call to a debtor for udhari collection.

    Returns call status and metadata.
    """
    # Generate the English TTS script
    script = _generate_call_script(
        debtor_name=debtor_name,
        amount=amount,
        merchant_name=merchant_name,
        merchant_owner=merchant_owner,
        tone=tone,
    )

    # For demo: simulate the call
    call_result = {
        "success": True,
        "call_id": f"CALL_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "debtor_name": debtor_name,
        "debtor_phone": debtor_phone,
        "amount": amount,
        "script": script,
        "status": "initiated",
        "duration": 0,
        "answered": False,
        "tone": tone,
        "payment_link": payment_link,
        "timestamp": datetime.now().isoformat(),
        "mode": "demo",  # "demo" or "twilio"
    }

    # If Twilio credentials are available, make a real call
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        try:
            call_result = await _make_twilio_call(
                phone=debtor_phone,
                script=script,
                payment_link=payment_link,
            )
            call_result["mode"] = "twilio"
        except Exception as e:
            logger.error(f"Twilio call failed: {e}")
            call_result["error"] = str(e)

    logger.info(f"Collection call: {debtor_name} ({debtor_phone}) — {call_result['status']}")
    return call_result


def _generate_call_script(
    debtor_name: str,
    amount: float,
    merchant_name: str,
    merchant_owner: str,
    tone: str,
) -> str:
    """Generate English TTS script for the collection call."""
    scripts = {
        "friendly_reminder": (
            f"Hello {debtor_name}! "
            f"This is a gentle reminder from {merchant_name}. "
            f"Your payment of Rs {amount:,.0f} is currently pending. "
            f"For your convenience, a payment link is being sent via SMS. "
            f"Thank you!"
        ),
        "polite_follow_up": (
            f"Hello {debtor_name}! "
            f"I am calling on behalf of {merchant_owner}. "
            f"Your payment of Rs {amount:,.0f} is still pending. "
            f"Please arrange to send it as soon as possible. "
            f"You will receive a payment link via SMS. Thank you!"
        ),
        "firm_request": (
            f"Hello {debtor_name}! "
            f"This is an important message from {merchant_name}. "
            f"Your payment of Rs {amount:,.0f} has been pending for a while. "
            f"Please settle this today. "
            f"A payment link is being sent via SMS. Thank you."
        ),
        "urgent_notice": (
            f"Hello {debtor_name}! "
            f"Your payment of Rs {amount:,.0f} has been overdue for a long time. "
            f"This is a final reminder. "
            f"Please make the payment immediately. The link is in your SMS."
        ),
    }
    return scripts.get(tone, scripts["polite_follow_up"])


async def _make_twilio_call(
    phone: str,
    script: str,
    payment_link: str,
) -> dict:
    """
    Make actual Twilio call.

    Requires: pip install twilio
    """
    try:
        from twilio.rest import Client

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        # Create TwiML for the voice call
        twiml = f"""
        <Response>
            <Say language="hi-IN" voice="Polly.Aditi">
                {script}
            </Say>
            <Pause length="2"/>
            <Say language="hi-IN" voice="Polly.Aditi">
                If you have any issues, please call {TWILIO_PHONE_NUMBER}.
            </Say>
        </Response>
        """

        call = client.calls.create(
            twiml=twiml,
            to=phone,
            from_=TWILIO_PHONE_NUMBER,
        )

        # Also send SMS with payment link
        if payment_link:
            client.messages.create(
                body=f"Hello! You have pending dues. Please pay: {payment_link}",
                to=phone,
                from_=TWILIO_PHONE_NUMBER,
            )

        return {
            "success": True,
            "call_id": call.sid,
            "status": call.status,
            "debtor_phone": phone,
            "script": script,
        }

    except ImportError:
        logger.warning("Twilio not installed. Run: pip install twilio")
        return {"success": False, "error": "Twilio not installed"}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def simulate_call(
    debtor_name: str,
    amount: float,
    tone: str = "polite_follow_up",
) -> dict:
    """
    Simulate a voice call for demo purposes.
    Returns the script and simulated status.
    """
    script = _generate_call_script(
        debtor_name=debtor_name,
        amount=amount,
        merchant_name="Sunita Saree Shop",
        merchant_owner="Sunita ji",
        tone=tone,
    )

    return {
        "success": True,
        "mode": "simulation",
        "debtor_name": debtor_name,
        "amount": amount,
        "script": script,
        "tone": tone,
        "status": "completed",
        "duration_seconds": 24,
        "answered": True,
        "listened_fully": True,
        "sms_sent": True,
        "timestamp": datetime.now().isoformat(),
    }
