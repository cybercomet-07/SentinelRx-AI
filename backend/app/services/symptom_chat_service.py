"""
SentinelRX-AI Symptom Chat Service - Cohere-powered medicine recommendation.
Uses DB inventory + Cohere to suggest medicines for user's symptoms/disease.
Only recommends medicines that exist in our DB. If none match, advises doctor consultation.
"""
import uuid

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.chat_history import GeneralTalkChatHistory
from app.models.medicine import Medicine


def _get_inventory_for_cohere(db: Session, limit: int = 100) -> str:
    """Get medicine inventory as formatted string for Cohere. Includes name, description, category, price, stock."""
    medicines = (
        db.query(Medicine)
        .filter(Medicine.quantity > 0)
        .order_by(Medicine.name)
        .limit(limit)
        .all()
    )
    if not medicines:
        return "(No medicines in stock)"
    lines = []
    for m in medicines:
        desc = m.description or ""
        cat = f" [{m.category}]" if m.category else ""
        lines.append(f"- {m.name}{cat} | ₹{m.price} | Stock: {m.quantity} | {desc}")
    return "\n".join(lines)


LANG_NAMES = {
    "hi-IN": "Hindi", "mr-IN": "Marathi", "ta-IN": "Tamil", "te-IN": "Telugu",
    "bn-IN": "Bengali", "kn-IN": "Kannada", "ml-IN": "Malayalam", "pa-IN": "Punjabi",
    "gu-IN": "Gujarati", "ur-IN": "Urdu", "en-IN": "English", "en-US": "English", "en-GB": "English",
}


def symptom_chat(db: Session, message: str, user_id: uuid.UUID | None = None, user_email: str | None = None, response_lang: str | None = None, chat_session_id: str | None = None, history: list[dict] | None = None) -> str:
    """
    Handle symptom-based chat using Cohere.
    CONVERSATIONAL FLOW:
    1. User describes symptom (e.g. "I have headache what to do?") → AI listens, asks how to help, does NOT suggest medicine yet.
    2. AI asks "Can I suggest you some medicine for [symptom]?"
    3. Only when user says "yes suggest", "tell me medicine", etc. → AI suggests from inventory.
    """
    settings = get_settings()
    if not settings.cohere_api_key:
        return "SentinelRX-AI is not configured. Please set COHERE_API_KEY in backend/.env"

    inventory = _get_inventory_for_cohere(db)
    history = history or []

    lang_instruction = ""
    if response_lang and response_lang in LANG_NAMES:
        lang_name = LANG_NAMES[response_lang]
        lang_instruction = (
            f"\nCRITICAL: Respond ONLY in {lang_name}. Use fluent, natural {lang_name} — "
            f"not English translated word-by-word. Write as a native {lang_name} speaker would.\n"
        )
    system_prompt = f"""You are SentinelRX-AI, a professional pharmacy assistant. Use clear, concise medical language.{lang_instruction}

CONVERSATIONAL FLOW (FOLLOW STRICTLY):

PHASE 1 - When user has NOT mentioned any specific symptom/disease:
- Respond: "I'm listening. How can I help you? Please describe your symptoms or condition."

PHASE 2 - When user HAS mentioned a symptom/disease (fever, headache, cold, cough, pain, etc.) in current message OR chat history:
- DO NOT suggest medicine yet.
- Acknowledge professionally: "I understand you have [symptom]. Would you like me to suggest suitable medicines from our pharmacy?"

PHASE 3 - ONLY when user explicitly asks for medicine (e.g. "yes suggest", "tell me medicine", "suggest me medicine"):
- Suggest medicines from the inventory below. Use professional medical tone.
- Format: "For [symptom], we recommend: [Medicine 1] (₹price), [Medicine 2] (₹price). Type 'order [medicine name]' to purchase. Please consult a pharmacist for personalized advice."
- Pick ONLY medicines suitable for their condition. Return names EXACTLY as in inventory.
- If no suitable medicine: "We do not have a suitable medicine for that condition in stock. Please consult a doctor."
- Keep responses concise: 2-3 sentences max. No lengthy descriptions.

Our pharmacy inventory (name | price | stock | description):
"""
    system_prompt += inventory
    system_prompt += """

TONE: Professional, clear, concise. Like a trained pharmacy assistant.
"""

    try:
        import cohere
        co = cohere.ClientV2(api_key=settings.cohere_api_key)
        # Build messages: system + history + current user message
        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-8:]:  # Last 8 turns for context
            role = "user" if h.get("role") == "user" else "assistant"
            content = (h.get("content") or "").strip()
            if content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})
        response = co.chat(
            model="command-r-plus-08-2024",
            messages=messages,
        )
        text = ""
        if hasattr(response, "message") and response.message and hasattr(response.message, "content") and response.message.content:
            first = response.message.content[0]
            text = getattr(first, "text", str(first))
        if not text:
            text = str(response)
        result = text.strip()

        # Log to general_talk_chat_history (SentinelRX-AI - separate table)
        if user_id:
            try:
                db.add(
                    GeneralTalkChatHistory(
                        user_id=user_id,
                        user_email=user_email,
                        user_message=message,
                        ai_response={"response": result[:500]},
                        chat_session_id=chat_session_id,
                    )
                )
                db.commit()
            except Exception:
                db.rollback()

        return result
    except Exception as e:
        err_msg = f"Sorry, I couldn't process your request. Please try again. (Error: {str(e)[:80]})"
        if user_id:
            try:
                db.add(
                    GeneralTalkChatHistory(
                        user_id=user_id,
                        user_email=user_email,
                        user_message=message,
                        ai_response={"response": err_msg[:500], "error": True},
                        chat_session_id=chat_session_id,
                    )
                )
                db.commit()
            except Exception:
                db.rollback()
        return err_msg
