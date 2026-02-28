"""Backfill user_name for orders that have NULL."""
from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        UPDATE orders o SET user_name = u.name
        FROM users u
        WHERE o.user_id = u.id AND (o.user_name IS NULL OR o.user_name = '')
    """))
    conn.commit()
    r = conn.execute(text("SELECT COUNT(*) FROM orders WHERE user_name IS NULL"))
    print("Orders still with null user_name:", r.scalar())
