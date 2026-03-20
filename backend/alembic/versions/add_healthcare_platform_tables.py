"""Add doctor_profiles, appointments, hospital_beds, hospital_admissions, ngo tables

Revision ID: add_healthcare_tables
Revises: add_new_user_roles
Create Date: 2026-03-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_healthcare_tables'
down_revision = 'add_new_user_roles'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── doctor_profiles ────────────────────────────────────────────────────
    op.create_table(
        'doctor_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), unique=True, nullable=False),
        sa.Column('specialization', sa.String(120), nullable=False, server_default='General Medicine'),
        sa.Column('license_no', sa.String(60), nullable=True),
        sa.Column('hospital_name', sa.String(200), nullable=True),
        sa.Column('hospital_address', sa.Text, nullable=True),
        sa.Column('consultation_fee', sa.Float, server_default='0'),
        sa.Column('experience_years', sa.Integer, server_default='0'),
        sa.Column('bio', sa.Text, nullable=True),
        sa.Column('languages', sa.String(300), server_default='English'),
        sa.Column('available_days', sa.String(200), server_default='Mon,Tue,Wed,Thu,Fri'),
        sa.Column('slot_duration_minutes', sa.Integer, server_default='30'),
        sa.Column('is_available', sa.Boolean, server_default='true'),
        sa.Column('rating', sa.Float, server_default='0'),
        sa.Column('total_reviews', sa.Integer, server_default='0'),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── appointments ──────────────────────────────────────────────────────
    op.create_table(
        'appointments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('appointment_date', sa.Date, nullable=False),
        sa.Column('time_slot', sa.String(20), nullable=False),
        sa.Column('appointment_type', sa.Text, server_default='In Person'),
        sa.Column('status', sa.Text, server_default='PENDING', nullable=False),
        sa.Column('symptoms', sa.Text, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('prescription_issued', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── hospital_beds ──────────────────────────────────────────────────────
    op.create_table(
        'hospital_beds',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('hospital_admin_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('bed_number', sa.String(20), nullable=False),
        sa.Column('ward', sa.String(100), nullable=False),
        sa.Column('bed_type', sa.Text, server_default='General', nullable=False),
        sa.Column('status', sa.Text, server_default='AVAILABLE', nullable=False),
        sa.Column('floor', sa.Integer, server_default='1'),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── hospital_admissions ────────────────────────────────────────────────
    op.create_table(
        'hospital_admissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('hospital_admin_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('bed_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hospital_beds.id'), nullable=True),
        sa.Column('patient_name', sa.String(200), nullable=False),
        sa.Column('patient_phone', sa.String(20), nullable=True),
        sa.Column('patient_age', sa.Integer, nullable=True),
        sa.Column('patient_gender', sa.String(20), nullable=True),
        sa.Column('diagnosis', sa.Text, nullable=True),
        sa.Column('admit_date', sa.Date, nullable=False),
        sa.Column('discharge_date', sa.Date, nullable=True),
        sa.Column('status', sa.Text, server_default='ADMITTED', nullable=False),
        sa.Column('total_bill', sa.Float, server_default='0'),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── ngo_beneficiaries ──────────────────────────────────────────────────
    op.create_table(
        'ngo_beneficiaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('ngo_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('age', sa.Integer, nullable=True),
        sa.Column('gender', sa.String(20), nullable=True),
        sa.Column('health_condition', sa.String(500), nullable=True),
        sa.Column('scheme_eligible', sa.Boolean, server_default='false'),
        sa.Column('scheme_names', sa.Text, nullable=True),
        sa.Column('status', sa.Text, server_default='ACTIVE', nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── ngo_blood_camps ────────────────────────────────────────────────────
    op.create_table(
        'ngo_blood_camps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('ngo_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('date', sa.Date, nullable=False),
        sa.Column('location', sa.Text, nullable=False),
        sa.Column('target_units', sa.Integer, server_default='50'),
        sa.Column('collected_units', sa.Integer, server_default='0'),
        sa.Column('volunteers', sa.Integer, server_default='0'),
        sa.Column('status', sa.Text, server_default='UPCOMING', nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── ngo_donation_drives ────────────────────────────────────────────────
    op.create_table(
        'ngo_donation_drives',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('ngo_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('start_date', sa.Date, nullable=False),
        sa.Column('end_date', sa.Date, nullable=True),
        sa.Column('target_amount', sa.Float, server_default='0'),
        sa.Column('raised_amount', sa.Float, server_default='0'),
        sa.Column('status', sa.Text, nullable=False, server_default='UPCOMING'),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
    )


def downgrade() -> None:
    op.drop_table('ngo_donation_drives')
    op.drop_table('ngo_blood_camps')
    op.drop_table('ngo_beneficiaries')
    op.drop_table('hospital_admissions')
    op.drop_table('hospital_beds')
    op.drop_table('appointments')
    op.drop_table('doctor_profiles')
