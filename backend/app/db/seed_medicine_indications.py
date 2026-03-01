"""
Seed medicine_indications from the keyword index. Runs on backend startup.
"""
from app.db.session import SessionLocal
from app.models.medicine import Medicine
from app.models.medicine_indication import MedicineIndication

INDICATION_DATA = {
    "Panthenol Spray": ("skin regeneration, irritated skin, damaged skin, wound care, dry skin, minor burns, skin hydration, dermatology care", "External use only, apply as needed", "External use only. Apply as needed.", False),
    "NORSAN Omega-3 Total": ("heart health, brain function, joint support, inflammation reduction, cardiovascular support, omega-3 supplement, memory support", "As per product label", None, False),
    "NORSAN Omega-3 Vegan": ("plant omega-3, vegan supplement, heart support, brain health, anti-inflammatory, algae oil", "As per product label", None, False),
    "NORSAN Omega-3 Kapseln": ("omega-3 capsules, cholesterol support, heart health, cognitive function, joint mobility", "As per product label", None, False),
    "Vividrin": ("allergy eyes, itchy eyes, red eyes, allergic conjunctivitis, pollen allergy, eye drops", "As per product label", None, False),
    "Aqualibra": ("bladder support, urinary tract, mild UTI support, urinary discomfort, herbal bladder medicine", "As per product label", None, False),
    "Vitasprint Pro": ("fatigue, low energy, vitamin B complex, energy boost, mental performance, amino acids", "As per product label", None, False),
    "Cystinol": ("urinary tract infection, UTI treatment, bladder infection, painful urination, herbal antibiotic support", "As per product label", None, False),
    "Cromo ratiopharm": ("eye allergy prevention, itchy eyes, allergic eye drops, seasonal allergy, antihistamine eye", "As per product label", None, False),
    "Kijimea Reizdarm": ("IBS, irritable bowel syndrome, bloating, abdominal pain, gut microbiome, digestive health", "As per product label", None, False),
    "Mucosolvan": ("cough relief, mucus dissolving, bronchitis, chest congestion, respiratory infection", "1 capsule daily", "Max 4-5 days without doctor.", False),
    "OMNI-BIOTIC": ("probiotic, gut flora support, immune support, fatigue reduction, digestive balance", "As per product label", None, False),
    "Osa Schorf": ("cradle cap, baby scalp care, dry scalp baby, infant skin care", "As per product label", None, False),
    "Multivitamin fruit gummies": ("multivitamin, immune support, daily vitamins, vegan vitamins, sugar-free supplement", "As per product label", None, False),
    "Iberogast": ("stomach pain, gastritis, indigestion, bloating, IBS, acid reflux", "20 drops 3 times daily", "Short-term use recommended.", False),
    "COLPOFIX": ("cervical health, vaginal gel, HPV support, vaginal dryness, mucosal healing", "As per product label", None, False),
    "RedCare eye drops": ("dry eyes, irritated eyes, eye hydration, screen dryness relief", "As per product label", None, False),
    "MULTILAC Darmsynbiotikum": ("probiotic, prebiotic, digestive balance, gut flora, antibiotic recovery", "As per product label", None, False),
    "SAW PALMETTO": ("prostate health, urinary flow, BPH support, men's health supplement", "320-350 mg/day typical dose", None, False),
    "Paracetamol": ("pain relief, fever reduction, headache, body pain, cold symptoms", "1-2 tablets every 4-6 hours", "Max 3,000-4,000 mg/day. Max 1,000 mg per dose. Do not exceed 3 days without doctor.", False),
    "Prostata Men": ("prostate support, urinary health, men's supplement", "1-2 capsules daily", None, False),
    "Natural Intimate Creme": ("intimate care, vaginal dryness, irritation relief, sensitive skin care", "As per product label", None, False),
    "proBIO 6": ("probiotic capsules, digestive health, bloating relief, gut balance", "As per product label", None, False),
    "Eucerin DERMOPURE": ("acne treatment, oily skin, pimples, blemishes, facial cleanser", "1-2 times daily", "Avoid overuse (skin dryness).", False),
    "frida baby Flakefixer": ("baby scalp, cradle cap remover, infant grooming", "As per product label", None, False),
    "Vitaphin D3": ("vitamin D deficiency, bone health, immune support, calcium absorption", "2,000 IU/day typical", "Upper safe limit ~4,000 IU/day.", False),
    "Bepanthen": ("wound healing, diaper rash, skin repair, minor cuts, skin irritation", "External application", "Safe for daily use.", False),
    "V-Biotics Flora": ("immune support, probiotic blend, gut health, digestive support", "As per product label", None, False),
    "Aveeno Skin Relief": ("dry skin relief, eczema care, itching relief, body moisturizer", "As per product label", None, False),
    "Centrum Vital": ("brain health, cognitive support, memory, multivitamin, focus support", "As per product label", None, False),
    "Redcare Wundschutzcreme": ("skin barrier cream, diaper rash prevention, irritated skin care", "As per product label", None, False),
    "Cetaphil smoothing": ("salicylic acid cleanser, rough skin, acne, exfoliating cleanser", "1-2 times daily", "Avoid overuse (skin dryness).", False),
    "Magnesium Verla": ("muscle cramps, magnesium deficiency, nerve support, stress reduction", "As per product label", "Max 250-400 mg elemental magnesium/day. High doses cause diarrhea.", False),
    "Livocab direct": ("eye allergy relief, antihistamine eye drops, hay fever", "As per product label", None, False),
    "Cetirizin HEXAL": ("allergy relief, antihistamine, hay fever, itching, sneezing", "10 mg/day (Adults)", "Avoid driving if drowsy.", False),
    "Loperamid akut": ("diarrhea treatment, acute diarrhea, stomach upset, travel diarrhea", "As per product label", "Max 8 mg/day OTC. Use max 2 days. Not for children under 6.", False),
    "Ramipril": ("high blood pressure, hypertension, heart failure, cardiovascular risk reduction", "Prescription only", "Prescription required. Doctor monitoring mandatory.", True),
    "GRANU FINK femina": ("bladder health women, urinary frequency, urinary discomfort", "As per product label", None, False),
    "Vitasprint B12": ("vitamin B12 deficiency, energy support, nerve function, anemia prevention", "1 capsule daily", "High dose B12 usually safe but medical advice recommended.", False),
    "Sinupret Saft": ("sinusitis, nasal congestion, sinus infection, cold symptoms", "As per age dosing", "Max 7-14 days use.", False),
    "Nurofen": ("pain relief, ibuprofen, headache, muscle pain, fever, inflammation", "As per product label", "Max 1,200 mg/day OTC. Take with food. Max 3 days without doctor.", False),
    "Vitamin B complex ratiopharm": ("B vitamins, nerve health, fatigue, stress support", "As per product label", None, False),
    "Calmvalera": ("sleep aid, anxiety relief, nervousness, stress", "As directed", "Avoid long-term self-medication. STRICT: Sleep-related medicines require prescription.", True),
    "femiloges": ("menopause symptoms, hot flashes, hormonal balance, mood swings", "As per product label", None, False),
    "Umckaloabo": ("respiratory infection, cough, bronchitis, cold in children", "As per age dosing", "Max 7 days use.", False),
    "Dulcolax": ("constipation relief, laxative, bowel movement stimulation", "5-10 mg daily", "Short-term use only (max 1 week). Avoid chronic use.", False),
    "Diclac-ratiopharm": ("muscle pain, joint pain, arthritis, sprain, topical anti-inflammatory", "Apply 3-4 times daily", "Max 14 days without medical advice. External use only. Avoid broken skin.", False),
    "Minoxidil": ("hair loss treatment, alopecia, hair regrowth, scalp treatment", "Apply 1 ml twice daily", "Do not exceed 2 ml/day. Continuous long-term use required.", False),
    "Hyaluron ratiopharm eye drops": ("dry eyes, eye lubrication, eye strain, contact lens dryness", "Use as needed", "Up to several times daily.", False),
    "Fenihydrocort": ("skin inflammation, itching, eczema, dermatitis, mild cortisone", "Thin layer application", "Use max 1-2 weeks. Avoid large skin areas.", False),
    "Eucerin UreaRepair": ("very dry skin, cracked skin, urea lotion, skin barrier repair", "As per product label", None, False),
    "Vigantolvit": ("vitamin D deficiency, bone health, immune support, calcium absorption", "2,000 IU/day typical", "Upper safe limit ~4,000 IU/day.", False),
}


def _match_medicine(name: str) -> tuple | None:
    name_lower = name.lower()
    for key, data in INDICATION_DATA.items():
        if key.lower() in name_lower:
            return data
    return None


def seed_indications() -> None:
    db = SessionLocal()
    try:
        medicines = db.query(Medicine).all()
        created = 0
        updated = 0
        for m in medicines:
            match = _match_medicine(m.name)
            if not match:
                continue
            keywords, dosage, safe_limit, requires_rx = match
            existing = db.query(MedicineIndication).filter(MedicineIndication.medicine_id == m.id).first()
            if existing:
                existing.keywords = keywords
                existing.dosage_instructions = dosage
                existing.safe_limit = safe_limit
                existing.requires_prescription = requires_rx
                updated += 1
            else:
                db.add(MedicineIndication(
                    medicine_id=m.id,
                    keywords=keywords,
                    dosage_instructions=dosage,
                    safe_limit=safe_limit,
                    requires_prescription=requires_rx,
                ))
                created += 1
        db.commit()
    finally:
        db.close()
