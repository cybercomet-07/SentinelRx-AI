"""
Seed product_id, pin, and description from PDF export into medicines table.
Matches by product name (case-insensitive, normalized).
Run from backend dir: python scripts/seed_medicine_pdf_data.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.medicine import Medicine

# PDF data: (product_id, product_name, pin, description)
# Extracted from products-export (1).pdf - products and descriptions in order
PDF_PRODUCTS = [
    ("16066", "Panthenol Spray", "04020784", "130 g Schaumspray zur Anwendung auf der Haut. Fördert die Regeneration gereizter oder geschädigter Haut und spendet Feuchtigkeit."),
    ("976308", "NORSAN Omega-3 Total", "13476520", "200 ml Flüssiges Omega-3-Öl aus Fisch. Unterstützt Herz, Gehirn und Gelenke."),
    ("977179", "NORSAN Omega-3 Vegan", "13476394", "100 ml Pflanzliches Omega-3 aus Algen. Geeignet für Vegetarier und Veganer."),
    ("993687", "NORSAN Omega-3 Kapseln", "13512730", "120 st Omega-3-Kapseln zur täglichen Nahrungsergänzung."),
    ("1225428", "Vividrin iso EDO antiallergische Augentropfen", "16507327", "30x0.5 ml Konservierungsmittelfreie Augentropfen zur Linderung allergischer Beschwerden wie Juckreiz und Rötung."),
    ("202796", "Aqualibra", "00795287", "60 st Pflanzliches Arzneimittel zur Unterstützung der Blasenfunktion."),
    ("1103035", "Vitasprint Pro Energie", "14050243", "8 st Nahrungsergänzungsmittel mit B-Vitaminen und Aminosäuren zur Verringerung von Müdigkeit."),
    ("27955", "Cystinol akut", "07114824", "60 st Pflanzliches Arzneimittel zur Behandlung akuter Harnwegsinfektionen."),
    ("30955", "Cromo-ratiopharm Augentropfen", "04884527", "20x0.5 ml Antiallergische Augentropfen zur Vorbeugung und Behandlung von allergischen Augenbeschwerden."),
    ("1162261", "Kijimea Reizdarm PRO", "15999676", "28 st Medizinisches Produkt zur Linderung von Symptomen des Reizdarmsyndroms wie Blähungen und Bauchschmerzen."),
    ("1204782", "Mucosolvan", "15210915", "50 st Langwirksames Arzneimittel zur Schleimlösung bei Husten."),
    ("1210016", "OMNi-BiOTiC SR-9", "16487346", "28x3 g Probiotikum mit B-Vitaminen zur Unterstützung der Darmflora und des Energiestoffwechsels."),
    ("1245942", "Osa Schorf Spray", "16781761", "30 ml Pflegespray zur sanften Entfernung von Milchschorf und trockener Kopfhaut bei Babys."),
    ("1247528", "Multivitamin Fruchtgummibärchen", "16908486", "60 st Vegane, zuckerfreie Multivitamin-Gummibärchen zur täglichen Versorgung mit Vitaminen."),
    ("1273105", "Iberogast Classic", "16507540", "50 ml Pflanzliches Arzneimittel bei Magen-Darm-Beschwerden."),
    ("1358905", "COLPOFIX", "18389398", "40 ml Vaginalgel zur Unterstützung der Gesundheit der Zervixschleimhaut."),
    ("1293377", "Augentropfen RedCare", "17396686", "10 ml Befeuchtende Augentropfen bei trockenen oder gereizten Augen."),
    ("1313639", "MULTILAC Darmsynbiotikum", "17931783", "10 st Kombination aus Pro- und Präbiotika zur Unterstützung der Verdauung."),
    ("1319766", "SAW PALMETO", "18216723", "100 st Pflanzliches Nahrungsergänzungsmittel zur Unterstützung der Prostatafunktion."),
    ("1329121", "Paracetamol apodiscounter", "18188323", "20 st Schmerz- und fiebersenkendes Arzneimittel."),
    ("1352774", "Prostata Men Kapseln", "18657640", "60 st Nahrungsergänzungsmittel zur Unterstützung der Prostatagesundheit."),
    ("1357649", "Natural Intimate Creme", "18769758", "50 ml Pflegecreme zur Befeuchtung und zum Schutz des sensiblen Intimbereichs."),
    ("1358513", "proBIO 6 Probiotik Kapseln", "18317737", "30 st Probiotische Kapseln zur Unterstützung einer gesunden Darmflora."),
    ("1363580", "Eucerin DERMOPURE", "18222095", "150 ml Reinigungsgel für unreine Haut, reduziert Unreinheiten und Pickelmale."),
    ("1381140", "frida baby FlakeFixer", "19140755", "1 st Sanfte Pflege zur Entfernung von Milchschorf bei Babys."),
    ("1383626", "Vitasprint Duo Energie", "18760556", "20 st Nahrungsergänzungsmittel mit Vitaminen und Mineralstoffen zur Steigerung der Energie."),
    ("11334", "Bepanthen WUND-UND HEILSALBE", "01580241", "20 g Salbe zur Unterstützung der Wundheilung und Pflege trockener Haut."),
    ("1391185", "V-Biotics Flora Complex", "19296256", "19 g Probiotisches Nahrungsergänzungsmittel zur Unterstützung von Darm und Immunsystem."),
    ("1403860", "Aveeno Skin Relief Body Lotion", "19342855", "300 ml Beruhigende Körperlotion für sehr trockene und juckende Haut."),
    ("1434198", "Centrum Vital+ Mentale Leistung", "19486198", "30 st Multivitaminpräparat zur Unterstützung der geistigen Leistungsfähigkeit."),
    ("1434864", "Redcare Wundschutzcreme", "19280947", "100 ml Schutzcreme für gereizte und empfindliche Haut."),
    ("1435154", "Cetaphil Sanft glättende SA Reinigung", "19720688", "236 ml Sanfte Reinigung mit Salicylsäure für raue und unebene Haut."),
    ("14176", "Magnesium Verla N Dragées", "03554928", "50 st Magnesiumpräparat zur Unterstützung von Muskeln und Nerven."),
    ("704523", "Livocab direkt Augentropfen", "00676714", "4 ml Schnell wirksame Augentropfen bei allergischen Augenbeschwerden."),
    ("185422", "Cetirizin HEXAL Tropfen", "02579607", "10 ml Antihistaminikum zur Linderung von Allergiesymptomen."),
    ("198010", "Loperamid akut", "01338066", "10 st Arzneimittel zur Behandlung von akutem Durchfall."),
    ("202006", "Ramipril", "00766794", "20 st Verschreibungspflichtiges Arzneimittel zur Behandlung von Bluthochdruck."),
    ("306595", "GRANU FINK femina", "01499852", "30 st Pflanzliches Arzneimittel zur Unterstützung der Blasengesundheit bei Frauen."),
    ("324024", "Vitasprint B12 Kapseln", "04909523", "20 st Vitamin-B12-Präparat zur Unterstützung von Energie und Nervenfunktion."),
    ("332568", "Sinupret Saft", "00605588", "100 ml Pflanzliches Arzneimittel bei Nasennebenhöhlenentzündungen."),
    ("335765", "Nurofen", "02547582", "12 st Ibuprofen-Schmerzmittel in schnell löslicher Form."),
    ("363715", "Vitamin B-Komplex-ratiopharm", "04132750", "60 st Kombination verschiedener B-Vitamine zur Unterstützung des Nervensystems."),
    ("368333", "Calmvalera Hevert Tropfen", "06560421", "100 ml Homöopathisches Arzneimittel bei nervöser Unruhe und Schlafstörungen."),
    ("1248085", "femiLoges", "16815862", "30 st Hormonfreies Arzneimittel zur Linderung von Wechseljahresbeschwerden."),
    ("376212", "Umckaloabo Saft für Kinder", "08871266", "120 ml Pflanzlicher Saft zur Behandlung von Atemwegsinfektionen bei Kindern."),
    ("368367", "DulcoLax Dragées", "06800196", "100 st Abführmittel zur kurzfristigen Behandlung von Verstopfung."),
    ("717525", "Diclo-ratiopharm Schmerzgel", "04704198", "50 g Schmerzgel zur äußeren Anwendung bei Muskel- und Gelenkschmerzen."),
    ("772646", "Minoxidil BIO-H-TIN-Pharma", "10391763", "60 ml Lösung zur Anwendung auf der Kopfhaut bei erblich bedingtem Haarausfall."),
    ("790415", "Hyaluron-ratiopharm Augentropfen", "10810214", "10 ml Befeuchtende Augentropfen mit Hyaluronsäure bei trockenen Augen."),
    ("790661", "FeniHydrocort Creme", "10796980", "20 g Kortisonhaltige Creme zur Behandlung leichter Hautentzündungen und Juckreiz."),
    ("879236", "Eucerin UreaRepair PLUS Lotion", "11678159", "400 ml Intensiv pflegende Lotion für sehr trockene und raue Haut."),
    ("899231", "Vigantolvit 2000 I.E. Vitamin D3", "12423869", "120 st Vitamin-D-Präparat zur Unterstützung von Knochen und Immunsystem."),
]


def normalize(name: str) -> str:
    """Normalize for matching: lowercase, collapse spaces, remove special chars."""
    return " ".join(name.lower().replace(",", " ").replace(".", " ").replace("®", " ").replace("°", " ").split())


def match_keywords(pdf_name: str, db_name: str) -> bool:
    """Check if names match - PDF key words appear in DB name or vice versa."""
    p = normalize(pdf_name)
    d = normalize(db_name)
    skip = {"mg", "ml", "st", "g", "und", "für", "zur", "bei", "the", "and", "mit", "für"}
    pdf_words = [w for w in p.split() if len(w) > 1 and w not in skip]
    if not pdf_words:
        return p in d or d in p
    # First word (brand/product) must match
    first = pdf_words[0]
    if first not in d:
        return False
    # At least one more significant word should match
    for w in pdf_words[1:4]:
        if len(w) > 3 and w in d:
            return True
    # Or DB name is short and contains first word
    return len(d.split()) <= 4 and first in d


def seed(db: Session) -> None:
    medicines = db.query(Medicine).all()
    updated = 0
    for med in medicines:
        for product_id, pdf_name, pin, description in PDF_PRODUCTS:
            if match_keywords(pdf_name, med.name):
                med.product_id = product_id
                med.pin = pin
                med.description = description
                updated += 1
                print(f"  Matched: {med.name} -> product_id={product_id}, pin={pin}")
                break
    db.commit()
    print(f"Updated {updated} medicines with product_id, pin, description.")


def main():
    db = SessionLocal()
    try:
        print("Seeding medicine PDF data (product_id, pin, description)...")
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
