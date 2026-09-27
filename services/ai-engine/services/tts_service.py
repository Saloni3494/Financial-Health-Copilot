"""
Vyapaar GrowthOS Text-to-Speech Service

Primary: Sarvam Bulbul (Hindi-optimized, 2B parameter Indic TTS)
Fallback: Browser SpeechSynthesis API (handled frontend-side)

The "Muneem Personality" voice:
- Respectful, uses merchant's name
- Business-savvy, concise
- Warm but professional
"""

import httpx
import base64
from typing import Optional

from config import get_settings

settings = get_settings()


async def synthesize_speech(text: str, voice: str = "meera") -> Optional[bytes]:
    """
    Convert English text to speech audio.

    Args:
        text: English text to synthesize
        voice: Voice model ("meera" = female, "arvind" = male)

    Returns:
        Audio bytes (wav format) or None if service unavailable
    """
    if not settings.sarvam_api_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={
                    "api-subscription-key": settings.sarvam_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": [text],
                    "target_language_code": "en-IN",
                    "speaker": voice,
                    "pitch": 0,
                    "pace": 1.0,
                    "loudness": 1.5,
                    "speech_sample_rate": 22050,
                    "enable_preprocessing": True,
                    "model": "bulbul:v1",
                },
            )

            if response.status_code == 200:
                data = response.json()
                if "audios" in data and data["audios"]:
                    audio_b64 = data["audios"][0]
                    return base64.b64decode(audio_b64)

            return None

    except Exception as e:
        print(f"TTS Error: {e}")
        return None


async def generate_voice_confirmation(
    action_type: str,
    amount: Optional[float] = None,
    person: Optional[str] = None,
    summary: Optional[str] = None,
) -> str:
    """
    Generate English voice confirmation text for Soundbox speaker.

    Returns text (synthesis done separately or on frontend).
    """
    confirmations = {
        "income_added": f"Rs {amount:,.0f} income recorded." if amount else "Income recorded.",
        "expense_added": f"Rs {amount:,.0f} added to expenses." if amount else "Expense recorded.",
        "udhari_created": f"Credit of Rs {amount:,.0f} for {person} recorded. I will remind you." if person and amount else "Credit recorded.",
        "udhari_settled": f"{person} returned Rs {amount:,.0f}. Credit settled." if person and amount else "Credit settled.",
        "reminder_sent": f"Reminder sent to {person}." if person else "Reminders sent.",
        "query_response": summary or "Here is your account.",
    }

    return confirmations.get(action_type, "Recorded.")


# Pre-recorded audio phrases for demo (fallback when TTS is unavailable)
DEMO_AUDIO_PHRASES = {
    "greeting": "Hello! I am your Financial Copilot.",
    "rent_logged": "Added Rs 5,000 to rent. Today's total expenses are Rs 12,400.",
    "income_received": "Received payment via Paytm. Income updated.",
    "udhari_created": "Credit recorded. I will remind you in 3 days.",
    "udhari_collected": "Payment received! Credit settled.",
    "reminders_sent": "Sent 3 reminders along with the Paytm link.",
    "day_summary": "Today's sales are Rs 34,500. Expenses Rs 12,400. Profit Rs 22,100. Margin is 64 percent.",
    "profit_negative": "Today's profit is negative. Should we speed up credit collection?",
}
