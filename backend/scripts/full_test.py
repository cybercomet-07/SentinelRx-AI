import requests
import datetime
import sys

BASE = 'http://localhost:8000/api/v1'
results = []

def ok(label, r):
    status = 'PASS' if r.status_code < 400 else 'FAIL'
    results.append((status, label, r.status_code))

def fail(label, msg):
    results.append(('FAIL', label, msg))

# 1. Health
ok('Health check', requests.get(f'{BASE}/health'))

# 2. Logins
logins = [
    ('patient@sentinelrx.ai', 'Patient@123', 'user'),
    ('doctor@sentinelrx.ai', 'Doctor@123', 'doctor'),
    ('hospital@sentinelrx.ai', 'Hospital@123', 'hospital_admin'),
    ('ngo@sentinelrx.ai', 'NGO@1234', 'ngo'),
    ('admin@sentinelrx.ai', 'Admin@123', 'admin'),
]
tokens = {}
for email, pwd, role in logins:
    r = requests.post(f'{BASE}/auth/login', json={'email': email, 'password': pwd, 'selected_role': role})
    ok(f'Login: {role}', r)
    tokens[role] = r.json().get('access_token', '') if r.ok else ''

P = {'Authorization': f'Bearer {tokens["user"]}'}
D = {'Authorization': f'Bearer {tokens["doctor"]}'}
H = {'Authorization': f'Bearer {tokens["hospital_admin"]}'}
N = {'Authorization': f'Bearer {tokens["ngo"]}'}
A = {'Authorization': f'Bearer {tokens["admin"]}'}

# 3. Auth/Me — all roles
for label, hdr in [('Me: Patient', P), ('Me: Doctor', D), ('Me: Hospital', H), ('Me: NGO', N), ('Me: Admin', A)]:
    ok(label, requests.get(f'{BASE}/auth/me', headers=hdr))

# 4. Patient portal
ok('Cart: GET (patient)', requests.get(f'{BASE}/cart', headers=P))
ok('Medicines: list', requests.get(f'{BASE}/medicines', headers=P))
ok('Medicines: categories', requests.get(f'{BASE}/medicines/categories', headers=P))
ok('Orders: my list', requests.get(f'{BASE}/orders/my', headers=P))
ok('Notifications: patient', requests.get(f'{BASE}/notifications', headers=P))
ok('Refill alerts: list', requests.get(f'{BASE}/refill-alerts', headers=P))
ok('Prescriptions: my list', requests.get(f'{BASE}/prescriptions/my', headers=P))

# 5. Find Doctor + Book Appointment
r = requests.get(f'{BASE}/patient/doctors', headers=P)
ok('Patient: list doctors', r)
docs = r.json().get('items', []) if r.ok else []
doc_id = docs[0]['doctor_id'] if docs else None

if doc_id:
    ok('Patient: get doctor detail', requests.get(f'{BASE}/patient/doctors/{doc_id}', headers=P))
    fd = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()
    r2 = requests.post(f'{BASE}/patient/appointments', headers=P, json={
        'doctor_id': doc_id, 'appointment_date': fd,
        'time_slot': '11:00 AM', 'appointment_type': 'In Person',
        'symptoms': 'Auto-test: headache'
    })
    ok('Patient: book appointment', r2)
else:
    fail('Patient: get doctor detail', 'No doctors in DB')
    fail('Patient: book appointment', 'No doctors in DB')

ok('Patient: list own appointments', requests.get(f'{BASE}/patient/appointments', headers=P))

# 6. Doctor portal
ok('Doctor: get profile', requests.get(f'{BASE}/doctor/profile', headers=D))
r = requests.get(f'{BASE}/doctor/appointments', headers=D)
ok('Doctor: list appointments', r)
appts = r.json().get('items', []) if r.ok else []
aid = appts[0]['id'] if appts else None

if aid:
    ok('Doctor: confirm appointment', requests.put(f'{BASE}/doctor/appointments/{aid}', headers=D, json={'status': 'CONFIRMED'}))
    ok('Doctor: issue prescription', requests.post(
        f'{BASE}/doctor/appointments/{aid}/prescription', headers=D,
        json={'appointment_id': aid, 'medicines': 'Paracetamol 500mg - 1 tab 3x/day', 'prescription_text': 'Rest and fluids'}
    ))
else:
    fail('Doctor: confirm appointment', 'No appointments yet')
    fail('Doctor: issue prescription', 'No appointments yet')

ok('Doctor: list prescriptions', requests.get(f'{BASE}/doctor/prescriptions', headers=D))
ok('Doctor: list patients', requests.get(f'{BASE}/doctor/patients', headers=D))
ok('Doctor: stats', requests.get(f'{BASE}/doctor/stats', headers=D))
ok('Notifications: doctor', requests.get(f'{BASE}/notifications', headers=D))

# 7. Hospital portal
ok('Hospital: stats', requests.get(f'{BASE}/hospital/stats', headers=H))
ok('Hospital: beds list', requests.get(f'{BASE}/hospital/beds', headers=H))
r = requests.post(f'{BASE}/hospital/beds', headers=H, json={'bed_number': 'T-99', 'ward': 'TestWard', 'bed_type': 'General', 'floor': 1})
ok('Hospital: create bed', r)
bid = r.json().get('id') if r.ok else None
ok('Hospital: admissions list', requests.get(f'{BASE}/hospital/admissions', headers=H))
if bid:
    ok('Hospital: create admission', requests.post(f'{BASE}/hospital/admissions', headers=H, json={
        'bed_id': bid, 'patient_name': 'Test Patient', 'patient_phone': '9999999999',
        'patient_age': 30, 'patient_gender': 'Male', 'diagnosis': 'Autotest Fever',
        'admit_date': datetime.date.today().isoformat(), 'total_bill': 100.0
    }))
else:
    fail('Hospital: create admission', 'Bed creation failed')
ok('Hospital: inventory', requests.get(f'{BASE}/hospital/inventory', headers=H))
ok('Notifications: hospital', requests.get(f'{BASE}/notifications', headers=H))

# 8. NGO portal
ok('NGO: stats', requests.get(f'{BASE}/ngo/stats', headers=N))
ok('NGO: beneficiaries list', requests.get(f'{BASE}/ngo/beneficiaries', headers=N))
ok('NGO: create beneficiary', requests.post(f'{BASE}/ngo/beneficiaries', headers=N, json={
    'name': 'AutoTest Ben', 'phone': '8888888888', 'address': 'Test City', 'age': 40, 'gender': 'Male'
}))
ok('NGO: blood camps list', requests.get(f'{BASE}/ngo/blood-camps', headers=N))
ok('NGO: donations list', requests.get(f'{BASE}/ngo/donations', headers=N))
ok('Notifications: NGO', requests.get(f'{BASE}/notifications', headers=N))

# 9. Admin portal
ok('Admin: dashboard stats', requests.get(f'{BASE}/admin/dashboard', headers=A))
ok('Admin: users list', requests.get(f'{BASE}/admin/users', headers=A))
ok('Admin: all orders', requests.get(f'{BASE}/orders', headers=A))
ok('Notifications: admin', requests.get(f'{BASE}/notifications', headers=A))

# 10. Role isolation tests (expect 403)
isolation = [
    ('Doctor blocked from cart', requests.get(f'{BASE}/cart', headers=D), 403),
    ('Patient blocked from admin', requests.get(f'{BASE}/admin/dashboard', headers=P), 403),
    ('Patient blocked from doctor API', requests.get(f'{BASE}/doctor/profile', headers=P), 403),
    ('NGO blocked from hospital API', requests.get(f'{BASE}/hospital/beds', headers=N), 403),
    ('Doctor blocked from NGO API', requests.get(f'{BASE}/ngo/beneficiaries', headers=D), 403),
    ('Hospital blocked from NGO API', requests.get(f'{BASE}/ngo/beneficiaries', headers=H), 403),
]
for label, r, expected in isolation:
    status = 'PASS' if r.status_code == expected else 'FAIL'
    results.append((status, f'Role isolation: {label}', r.status_code))

# Print
passes = [x for x in results if x[0] == 'PASS']
fails  = [x for x in results if x[0] == 'FAIL']
print()
print('=' * 70)
print(f'  RESULTS: {len(passes)} PASS  /  {len(fails)} FAIL  /  {len(results)} TOTAL')
print('=' * 70)
for s, l, c in results:
    icon = 'ok' if s == 'PASS' else 'XX'
    print(f'  [{icon}] {l:<54} {c}')
print('=' * 70)
if fails:
    print('  FAILED TESTS:')
    for _, l, c in fails:
        print(f'    XX {l}  ->  {c}')
    sys.exit(1)
else:
    print('  ALL TESTS PASSED')
