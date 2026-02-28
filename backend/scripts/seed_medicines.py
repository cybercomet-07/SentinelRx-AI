import argparse
import csv
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.db.session import SessionLocal
from app.models.medicine import Medicine
from app.models.order_item import OrderItem

CSV_PATH = ROOT_DIR / "data" / "medicines_seed.csv"


def _read_seed_rows() -> list[dict]:
    rows: list[dict] = []
    with CSV_PATH.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            rows.append(
                {
                    "name": row["name"].strip(),
                    "description": (row.get("description") or "").strip(),
                    "price": float(row["price"]),
                    "quantity": int(row["quantity"]),
                    "category": (row.get("category") or "General").strip(),
                    "image_url": (row.get("image_url") or "").strip() or None,
                    "low_stock_threshold": int(row.get("low_stock_threshold") or 10),
                }
            )
    return rows


def seed_medicines(replace_existing: bool = False) -> None:
    db = SessionLocal()
    try:
        seed_rows = _read_seed_rows()

        if replace_existing:
            # Must delete order_items first (FK restricts medicine delete)
            deleted_items = db.query(OrderItem).delete()
            db.flush()
            print(f"Removed {deleted_items} order items (required for medicine replace).")
            deleted = db.query(Medicine).delete()
            db.flush()
            print(f"Removed {deleted} existing medicines.")

        existing_by_name = {item.name: item for item in db.query(Medicine).all()}
        created = 0
        updated = 0
        for row in seed_rows:
            existing = existing_by_name.get(row["name"])
            if existing:
                existing.description = row["description"]
                existing.price = row["price"]
                existing.quantity = row["quantity"]
                existing.category = row["category"]
                existing.image_url = row["image_url"]
                existing.low_stock_threshold = row["low_stock_threshold"]
                updated += 1
            else:
                db.add(Medicine(**row))
                created += 1

        db.commit()
        print(f"Seed complete. Created={created}, Updated={updated}, TotalRows={len(seed_rows)}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed medicines from CSV")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete existing medicines before seeding from CSV.",
    )
    args = parser.parse_args()
    seed_medicines(replace_existing=args.replace)
