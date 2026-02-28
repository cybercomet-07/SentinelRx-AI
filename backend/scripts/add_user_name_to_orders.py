"""Add user_name column to orders table and backfill from users."""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import text
from app.db.session import engine

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(120)"))
    conn.execute(text("""
        UPDATE orders o SET user_name = u.name FROM users u
        WHERE o.user_id = u.id AND (o.user_name IS NULL OR o.user_name = '')
    """))
    conn.commit()
print("Done: user_name column added and backfilled")
