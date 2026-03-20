"""Add DOCTOR, HOSPITAL_ADMIN, NGO roles to user_role enum

Revision ID: add_new_user_roles
Revises: add_payment_receipt_url_to_orders
Create Date: 2026-03-20
"""
from alembic import op

revision = 'add_new_user_roles'
down_revision = 'add_payment_receipt'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'DOCTOR'")
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'HOSPITAL_ADMIN'")
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'NGO'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly
    pass
