import psycopg
conn = psycopg.connect('postgresql://postgres:parth%40123@localhost:5432/sentinelrx')
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='medicine_indications'")
print("medicine_indications columns:", [r[0] for r in cur.fetchall()])
cur.execute("SELECT COUNT(*) FROM medicine_indications")
print("Total indications:", cur.fetchone()[0])
conn.close()
