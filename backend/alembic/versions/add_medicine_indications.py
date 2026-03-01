"""add medicine_indications table

Revision ID: add_medicine_indications
Revises: add_refill_reminder_sent
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "add_medicine_indications"
down_revision: Union[str, Sequence[str], None] = "add_refill_reminder_sent"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "medicine_indications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("medicine_id", UUID(as_uuid=True), sa.ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("keywords", sa.Text(), nullable=False),
        sa.Column("dosage_instructions", sa.Text(), nullable=True),
        sa.Column("safe_limit", sa.Text(), nullable=True),
        sa.Column("requires_prescription", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("ix_medicine_indications_medicine_id", "medicine_indications", ["medicine_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_medicine_indications_medicine_id", table_name="medicine_indications")
    op.drop_table("medicine_indications")
