"""add payment_method to orders

Revision ID: add_payment_method
Revises: add_preferred_language
Create Date: 2026-03-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_payment_method"
down_revision: Union[str, Sequence[str], None] = "add_preferred_language"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("payment_method", sa.String(20), nullable=True, server_default="cod"),
    )


def downgrade() -> None:
    op.drop_column("orders", "payment_method")
