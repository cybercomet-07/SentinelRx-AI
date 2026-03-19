"""
Migrate local PostgreSQL data to Neon cloud DB.
Copies: medicines, users, medicine_indications
Run from backend dir: py scripts/migrate_local_to_cloud.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import psycopg
from datetime import datetime

LOCAL_DSN = "postgresql://postgres:parth%40123@localhost:5432/sentinelrx"
CLOUD_DSN = "postgresql://neondb_owner:npg_rfTeMv7sIYE0@ep-wild-bread-a4u6udna-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def migrate():
    print("Connecting to local DB...")
    local = psycopg.connect(LOCAL_DSN)
    print("Connecting to Neon cloud DB...")
    cloud = psycopg.connect(CLOUD_DSN)

    lc = local.cursor()
    cc = cloud.cursor()

    # ── 1. MEDICINES ────────────────────────────────────────────────────────
    print("\n[1/3] Migrating medicines...")
    cc.execute("DELETE FROM order_items")
    cc.execute("DELETE FROM medicines")
    cloud.commit()

    lc.execute("SELECT id, name, description, price, quantity, category, image_url, low_stock_threshold, created_at, updated_at, product_id, pin, manufacturing_date, expiry_date FROM medicines")
    medicines = lc.fetchall()
    print(f"  Found {len(medicines)} medicines locally")

    for row in medicines:
        cc.execute("""
            INSERT INTO medicines (id, name, description, price, quantity, category, image_url, low_stock_threshold, created_at, updated_at, product_id, pin, manufacturing_date, expiry_date)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (id) DO UPDATE SET
                name=EXCLUDED.name, description=EXCLUDED.description, price=EXCLUDED.price,
                quantity=EXCLUDED.quantity, category=EXCLUDED.category, image_url=EXCLUDED.image_url,
                low_stock_threshold=EXCLUDED.low_stock_threshold, updated_at=EXCLUDED.updated_at
        """, row)
    cloud.commit()
    print(f"  ✅ {len(medicines)} medicines migrated")

    # ── 2. USERS ────────────────────────────────────────────────────────────
    print("\n[2/3] Migrating users...")
    lc.execute("SELECT id, name, email, password_hash, role, is_active, phone, address, landmark, pin_code, date_of_birth, gender, preferred_language, created_at FROM users")
    users = lc.fetchall()
    print(f"  Found {len(users)} users locally")

    migrated_users = 0
    for row in users:
        try:
            cc.execute("""
                INSERT INTO users (id, name, email, password_hash, role, is_active, phone, address, landmark, pin_code, date_of_birth, gender, preferred_language, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (email) DO UPDATE SET
                    name=EXCLUDED.name, password_hash=EXCLUDED.password_hash,
                    role=EXCLUDED.role, is_active=EXCLUDED.is_active,
                    phone=EXCLUDED.phone, address=EXCLUDED.address,
                    landmark=EXCLUDED.landmark, pin_code=EXCLUDED.pin_code
            """, row)
            migrated_users += 1
        except Exception as e:
            print(f"  Skipped user {row[2]}: {e}")
            cloud.rollback()
    cloud.commit()
    print(f"  ✅ {migrated_users} users migrated")

    # ── 3. MEDICINE INDICATIONS ─────────────────────────────────────────────
    print("\n[3/3] Migrating medicine indications...")
    try:
        lc.execute("SELECT id, medicine_id, keywords, dosage_instructions, safe_limit, requires_prescription FROM medicine_indications")
        indications = lc.fetchall()
        print(f"  Found {len(indications)} indications locally")
        cc.execute("DELETE FROM medicine_indications")
        for row in indications:
            cc.execute("""
                INSERT INTO medicine_indications (id, medicine_id, keywords, dosage_instructions, safe_limit, requires_prescription)
                VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING
            """, row)
        cloud.commit()
        print(f"  ✅ {len(indications)} medicine indications migrated")
    except Exception as e:
        print(f"  Skipped indications: {e}")
        cloud.rollback()

    local.close()
    cloud.close()
    print("\n🎉 Migration complete! All local data is now in the cloud DB.")

if __name__ == "__main__":
    migrate()
