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


def _is_medicine_recommendation_query(message: str) -> bool:
    """Detect if user is asking which tablets/medicines we have for a symptom/disease."""
    lower = message.lower().strip()
    symptom_phrases = (
        "which tablet", "which medicine", "what tablet", "what medicine",
        "tablet for", "medicine for", "tablets for", "medicines for",
        "do you have for", "have for", "recommend for", "suggest for",
        "for fever", "for headache", "for cold", "for cough", "for pain",
        "for allergy", "for stomach", "for my", "for this",
    )
    return any(p in lower for p in symptom_phrases) or len(lower.split()) <= 15


def symptom_chat(db: Session, message: str, user_id: uuid.UUID | None = None, user_email: str | None = None) -> str:
    """
    Handle symptom-based chat using Cohere.
    - General health questions: Cohere gives advice
    - "Which tablet for fever?": Cohere picks from DB inventory, returns only matching medicines
    - If no medicine in DB for that disease: "We don't have any medicine for that. Please consult a doctor."
    """
    settings = get_settings()
    if not settings.cohere_api_key:
        return "SentinelRX-AI is not configured. Please set COHERE_API_KEY in backend/.env"

    inventory = _get_inventory_for_cohere(db)
    is_medicine_query = _is_medicine_recommendation_query(message)

    system_prompt = """You are SentinelRX-AI, a helpful pharmacy assistant. You help users with:
1. General health advice (symptoms, when to see a doctor, self-care tips)
2. Medicine recommendations FROM OUR INVENTORY ONLY

CRITICAL RULES FOR MEDICINE RECOMMENDATIONS:
- ONLY recommend medicines from the inventory list below. Every medicine listed is IN STOCK at our pharmacy.
- When the user asks "which tablet for [disease/symptom]", you MUST look at the inventory and pick ONLY medicines that are suitable for that condition based on their name and description.
- Return the medicine names EXACTLY as they appear in the inventory (e.g. "Paracetamol 500 mg tablets" not "Paracetamol").
- Include the price (₹) and that they can order by going to the Order Agent and typing the medicine name.
- If NO medicine in our inventory is suitable for the user's disease/symptom, you MUST say: "We don't have any medicine for that disease in our inventory. Please consult a doctor for proper treatment."
- Never suggest medicines not in the inventory. Never make up medicine names.

Our pharmacy inventory (name | price | stock | description):
"""
    system_prompt += inventory
    system_prompt += """

Always add: "Consult a pharmacist or doctor for personalized advice."
Be concise and helpful."""

    try:
        import cohere
        co = cohere.ClientV2(api_key=settings.cohere_api_key)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ]
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

        # Log to general_talk_chat_history
        if user_id:
            try:
                db.add(
                    GeneralTalkChatHistory(
                        user_id=user_id,
                        user_email=user_email,
                        user_message=message,
                        ai_response={"response": result[:500]},
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
                    )
                )
                db.commit()
            except Exception:
                db.rollback()
        return err_msg
