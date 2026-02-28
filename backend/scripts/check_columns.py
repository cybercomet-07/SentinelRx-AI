"""Check users table columns"""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
r = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"))
cols = [row[0] for row in r]
print("Columns:", cols)
db.close()
