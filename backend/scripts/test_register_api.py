"""Test registration API and verify DB persistence"""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import requests
import random

email = f'debugtest{random.randint(10000,99999)}@example.com'
payload = {
    'name': 'Debug Test User',
    'email': email,
    'password': 'TestPass123!',
    'phone': '9876543210',
    'address': '123 Test Street',
    'landmark': 'Near Park',
    'pin_code': '400001',
    'date_of_birth': '1990-05-15',
}

print('Sending payload:', payload)
r = requests.post('http://127.0.0.1:8000/api/v1/auth/register', json=payload)
print('Status:', r.status_code)
if r.status_code != 200:
    print('Error:', r.text)
    sys.exit(1)

# Check DB
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
u = db.query(User).filter(User.email == email).first()
if u:
    print('DB values - phone:', repr(u.phone), 'address:', repr(u.address))
    # Cleanup
    db.delete(u)
    db.commit()
    print('Cleaned up')
else:
    print('User not found in DB!')
db.close()
