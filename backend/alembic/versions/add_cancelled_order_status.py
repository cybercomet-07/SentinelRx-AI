"""add CANCELLED to order_status enum

Revision ID: add_cancelled
Revises: add_product_id_pin
Create Date: 2026-02-28

"""
from typing import Sequence, Union

from alembic import op

revision: str = "add_cancelled"
down_revision: Union[str, Sequence[str], None] = "add_product_pin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'CANCELLED'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values easily
    pass
