"""
Seed medicine_indications from the keyword index. Can be run manually: py scripts/seed_medicine_indications.py
Also runs automatically when backend starts.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.seed_medicine_indications import seed_indications

if __name__ == "__main__":
    seed_indications()
    print("Done.")
