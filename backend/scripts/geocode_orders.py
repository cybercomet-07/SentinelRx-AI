"""Backfill lat/lng for orders that have delivery_address but no coordinates."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.services.geocoding_service import geocode_address


def main():
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT id, delivery_address FROM orders
            WHERE delivery_address IS NOT NULL AND delivery_address != ''
            AND (delivery_latitude IS NULL OR delivery_longitude IS NULL)
        """)).fetchall()
        updated = 0
        for row in rows:
            order_id, addr = row[0], row[1]
            lat, lng = geocode_address(addr)
            if lat is not None and lng is not None:
                db.execute(
                    text("UPDATE orders SET delivery_latitude = :lat, delivery_longitude = :lng WHERE id = :id"),
                    {"lat": lat, "lng": lng, "id": order_id},
                )
                updated += 1
                print(f"Geocoded order {order_id}: {addr[:50]}... -> ({lat}, {lng})")
            else:
                print(f"Could not geocode order {order_id}: {addr[:50]}...")
        db.commit()
        print(f"Done. Updated {updated} order(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
