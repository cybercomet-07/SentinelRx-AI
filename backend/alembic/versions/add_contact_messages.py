"""add contact_messages table

Revision ID: add_contact_messages
Revises: add_delivery_address
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "add_contact_messages"
down_revision: Union[str, Sequence[str], None] = "add_delivery_address"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contact_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("contact_details", sa.String(255), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("contact_messages")
