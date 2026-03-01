"""add manufacturing_date and expiry_date to medicines

Revision ID: add_medicine_expiry
Revises: add_contact_messages
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_medicine_expiry"
down_revision: Union[str, Sequence[str], None] = "add_contact_messages"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("medicines", sa.Column("manufacturing_date", sa.Date(), nullable=True))
    op.add_column("medicines", sa.Column("expiry_date", sa.Date(), nullable=True))
    op.create_index("ix_medicines_expiry_date", "medicines", ["expiry_date"], unique=False)

    op.execute("ALTER TYPE notification_type ADD VALUE 'EXPIRING_MEDICINE'")

    op.create_table(
        "medicine_expiry_notification",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("medicine_id", sa.UUID(), sa.ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("notified_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("medicine_expiry_notification")
    op.drop_index("ix_medicines_expiry_date", table_name="medicines")
    op.drop_column("medicines", "expiry_date")
    op.drop_column("medicines", "manufacturing_date")
