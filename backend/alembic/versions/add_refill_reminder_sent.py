"""add reminder_sent_at to refill_alerts

Revision ID: add_refill_reminder_sent
Revises: add_medicine_expiry
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_refill_reminder_sent"
down_revision: Union[str, Sequence[str], None] = "add_medicine_expiry"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("refill_alerts", sa.Column("reminder_sent_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("refill_alerts", "reminder_sent_at")
