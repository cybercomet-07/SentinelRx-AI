"""Add reminder_time and call_reminder_sent_at to refill_alerts

Revision ID: add_refill_time_call
Revises: add_hospital_enhanced
Create Date: 2026-03-21

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_refill_time_call'
down_revision = 'add_hospital_enhanced'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('refill_alerts', sa.Column('reminder_time', sa.String(5), nullable=True))
    op.add_column('refill_alerts', sa.Column('call_reminder_sent_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('refill_alerts', 'call_reminder_sent_at')
    op.drop_column('refill_alerts', 'reminder_time')
