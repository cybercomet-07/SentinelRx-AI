"""
Symptom-to-medicine recommendation using DeepSeek AI + medicine_indications DB.
For users WITHOUT prescription. Enforces prohibited categories.
"""
import logging
import re
import uuid

import requests
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.chat_history import SymptomSuggestionChatHistory
from app.models.medicine import Medicine
from app.models.medicine_indication import MedicineIndication

logger = logging.getLogger(__name__)

# Medicines/categories STRICTLY prohibited without prescription
PROHIBITED_KEYWORDS = [
    "sleep aid", "sleeping pills", "sedative", "benzodiazepine", "zolpidem",
    "opioid", "antibiotic", "ramipril", "blood pressure", "hypertension",
    "psychiatric", "antidepressant", "anxiety medication",
]

DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

LANG_NAMES = {
    "hi-IN": "Hindi", "mr-IN": "Marathi", "ta-IN": "Tamil", "te-IN": "Telugu",
    "bn-IN": "Bengali", "kn-IN": "Kannada", "ml-IN": "Malayalam", "pa-IN": "Punjabi",
    "gu-IN": "Gujarati", "ur-IN": "Urdu", "en-IN": "English", "en-US": "English", "en-GB": "English",
}


def _search_medicines_by_symptom(db: Session, symptom_text: str) -> list[dict]:
    """Search medicine_indications by keyword match. Excludes requires_prescription."""
    symptom_lower = symptom_text.lower().strip()
    words = re.findall(r"\w+", symptom_lower)
    if not words:
        return []

    indications = (
        db.query(MedicineIndication, Medicine)
        .join(Medicine, Medicine.id == MedicineIndication.medicine_id)
        .filter(MedicineIndication.requires_prescription.is_(False))
        .filter(Medicine.quantity > 0)
        .all()
    )

    results = []
    for ind, med in indications:
        kw_lower = ind.keywords.lower()
        score = sum(1 for w in words if len(w) > 2 and w in kw_lower)
        if score > 0:
            results.append({
                "id": str(med.id),
                "name": med.name,
                "keywords": ind.keywords,
                "dosage": ind.dosage_instructions or "As per product label",
                "safe_limit": ind.safe_limit,
                "price": med.price,
            })
    # Sort by score (simple: more keyword matches first)
    results.sort(key=lambda x: sum(1 for w in words if len(w) > 2 and w in x["keywords"].lower()), reverse=True)
    return results[:5]


def _is_prohibited_request(user_message: str) -> bool:
    """Check if user is asking for prohibited medicines (sleep, antibiotics, etc)."""
    msg_lower = user_message.lower()
    for kw in PROHIBITED_KEYWORDS:
        if kw in msg_lower:
            return True
    # Sleep tablets explicitly
    if any(w in msg_lower for w in ["sleep", "sleeping", "insomnia", "sedative"]):
        return True
    return False


def _log_prescription_chat(
    db: Session,
    user_id: uuid.UUID | None,
    user_email: str | None,
    user_message: str,
    response: str,
) -> None:
    if not user_id:
        return
    try:
        db.add(
            SymptomSuggestionChatHistory(
                user_id=user_id,
                user_email=user_email,
                user_message=user_message,
                ai_response={"recommendation": response[:500]},
            )
        )
        db.commit()
    except Exception:
        db.rollback()


def get_symptom_recommendation(
    db: Session,
    user_message: str,
    user_id: uuid.UUID | None = None,
    user_email: str | None = None,
    response_lang: str | None = None,
) -> str:
    """
    Get AI-powered medicine recommendation for symptom (no prescription).
    Returns formatted response with medicine names, dosage, limits.
    For prohibited requests, returns prescription-required message.
    """
    if _is_prohibited_request(user_message):
        response = (
            "This type of medicine requires a doctor's prescription. "
            "Please consult a doctor for proper evaluation and prescription. "
            "We cannot recommend sleep aids, antibiotics, blood pressure medicines, or similar without a prescription."
        )
        _log_prescription_chat(db, user_id, user_email, user_message, response)
        return response

    matches = _search_medicines_by_symptom(db, user_message)
    if not matches:
        response = (
            "We couldn't find medicines in our inventory that match your symptoms. "
            "Please consult a doctor or try describing your symptoms differently. "
            "If you have a prescription, you can order through our AI Chat."
        )
        _log_prescription_chat(db, user_id, user_email, user_message, response)
        return response

    settings = get_settings()
    if not settings.deepseek_api_key:
        response = _format_simple_response(matches)
        _log_prescription_chat(db, user_id, user_email, user_message, response)
        return response

    # Build context for DeepSeek
    meds_text = "\n".join([
        f"- {m['name']}: {m['dosage']}. Safe limit: {m['safe_limit'] or 'See label'}"
        for m in matches
    ])

    lang_instruction = ""
    if response_lang and response_lang in LANG_NAMES:
        lang_instruction = f"\nIMPORTANT: Respond ONLY in {LANG_NAMES[response_lang]}. The user is speaking in {LANG_NAMES[response_lang]}.\n"
    system_prompt = f"""You are a pharmacy assistant. The user has described symptoms but does NOT have a doctor's prescription.{lang_instruction}
You MUST only recommend medicines from the list below. Include:
1. Medicine name(s) that may help
2. Dosage instructions
3. Consumption limits (max per day, max days without doctor)
4. A clear disclaimer: "If symptoms persist, consult a doctor."
5. Do NOT recommend anything not in the list.
6. Be concise and helpful. Use simple language."""

    user_prompt = f"""User said: "{user_message}"

Available medicines from our inventory (with dosage and limits):
{meds_text}

Provide a helpful recommendation. Include dosage and consumption limits for each medicine you suggest."""

    try:
        r = requests.post(
            DEEPSEEK_URL,
            headers={
                "Authorization": f"Bearer {settings.deepseek_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 500,
                "temperature": 0.3,
            },
            timeout=30,
        )
        if r.status_code == 200:
            data = r.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if content:
                response = content.strip()
                _log_prescription_chat(db, user_id, user_email, user_message, response)
                return response
    except Exception as e:
        logger.exception("DeepSeek API failed: %s", e)

    response = _format_simple_response(matches)
    _log_prescription_chat(db, user_id, user_email, user_message, response)
    return response


def _format_simple_response(matches: list[dict]) -> str:
    """Fallback when AI is unavailable."""
    lines = ["Based on similar cases, we can suggest:\n"]
    for m in matches:
        lines.append(f"• **{m['name']}** – {m['dosage']}")
        if m["safe_limit"]:
            lines.append(f"  Limit: {m['safe_limit']}")
    lines.append("\nIf symptoms persist, please consult a doctor.")
    return "\n".join(lines)
