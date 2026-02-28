@echo off
cd /d "%~dp0backend"
call .venv\Scripts\activate.bat
echo Seeding medicines from data/medicines_seed.csv...
python scripts/seed_medicines.py --replace
echo Done. Medicines are now in the database.
pause
