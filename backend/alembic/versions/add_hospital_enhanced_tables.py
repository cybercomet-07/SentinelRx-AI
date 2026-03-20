"""Add hospital_medicines, hospital_patient_visits, hospital_bills tables

Revision ID: add_hospital_enhanced
Revises: add_healthcare_tables
Create Date: 2026-03-21
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_hospital_enhanced'
down_revision = 'add_healthcare_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── hospital_medicines ─────────────────────────────────────────────────
    op.create_table(
        'hospital_medicines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('hospital_admin_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('quantity', sa.Integer, server_default='0', nullable=False),
        sa.Column('unit', sa.String(20), server_default='tablets', nullable=False),
        sa.Column('price', sa.Float, server_default='0'),
        sa.Column('expiry_date', sa.Date, nullable=True),
        sa.Column('manufacturer', sa.String(200), nullable=True),
        sa.Column('reorder_level', sa.Integer, server_default='10'),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── hospital_patient_visits ────────────────────────────────────────────
    op.create_table(
        'hospital_patient_visits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('hospital_admin_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('patient_name', sa.String(200), nullable=False),
        sa.Column('patient_phone', sa.String(20), nullable=True),
        sa.Column('patient_age', sa.Integer, nullable=True),
        sa.Column('patient_gender', sa.String(20), nullable=True),
        sa.Column('visit_date', sa.Date, nullable=False),
        sa.Column('diagnosis', sa.Text, nullable=True),
        sa.Column('treatment', sa.Text, nullable=True),
        sa.Column('prescription_notes', sa.Text, nullable=True),
        sa.Column('next_visit_date', sa.Date, nullable=True),
        sa.Column('next_visit_notes', sa.String(500), nullable=True),
        sa.Column('govt_scheme', sa.String(300), nullable=True),
        sa.Column('status', sa.Text, server_default='VISITED', nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── hospital_bills ─────────────────────────────────────────────────────
    op.create_table(
        'hospital_bills',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('hospital_admin_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('patient_name', sa.String(200), nullable=False),
        sa.Column('patient_phone', sa.String(20), nullable=True),
        sa.Column('services_description', sa.Text, nullable=True),
        sa.Column('total_amount', sa.Float, server_default='0', nullable=False),
        sa.Column('amount_paid', sa.Float, server_default='0', nullable=False),
        sa.Column('payment_method', sa.Text, server_default='COD', nullable=False),
        sa.Column('payment_status', sa.Text, server_default='PENDING', nullable=False),
        sa.Column('qr_image_url', sa.Text, nullable=True),
        sa.Column('govt_scheme', sa.String(300), nullable=True),
        sa.Column('bill_date', sa.Date, nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
    )


def downgrade() -> None:
    op.drop_table('hospital_bills')
    op.drop_table('hospital_patient_visits')
    op.drop_table('hospital_medicines')
