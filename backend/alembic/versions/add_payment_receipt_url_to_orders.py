"""add payment_receipt_url to orders

Revision ID: add_payment_receipt
Revises: add_payment_method
Create Date: 2026-03-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_payment_receipt"
down_revision: Union[str, Sequence[str], None] = "add_payment_method"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("payment_receipt_url", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "payment_receipt_url")
