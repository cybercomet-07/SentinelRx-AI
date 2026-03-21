"""Ensure reminder_time and call_reminder_sent_at exist (idempotent)

Revision ID: ensure_refill_cols
Revises: add_refill_time_call
Create Date: 2026-03-21

"""
from alembic import op

revision = "ensure_refill_cols"
down_revision = "add_refill_time_call"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotent: add columns only if they don't exist (PostgreSQL 9.6+)
    op.execute(
        "ALTER TABLE refill_alerts ADD COLUMN IF NOT EXISTS reminder_time VARCHAR(5)"
    )
    op.execute(
        "ALTER TABLE refill_alerts ADD COLUMN IF NOT EXISTS call_reminder_sent_at TIMESTAMP"
    )


def downgrade() -> None:
    op.drop_column("refill_alerts", "call_reminder_sent_at")
    op.drop_column("refill_alerts", "reminder_time")
