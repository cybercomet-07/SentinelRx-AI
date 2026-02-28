"""add user_name to orders table

Revision ID: add_order_user_name
Revises: add_user_profile
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_order_user_name"
down_revision: Union[str, Sequence[str], None] = "add_user_profile"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('user_name', sa.String(120), nullable=True))
    # Backfill existing orders with user name from users table
    op.execute("""
        UPDATE orders o
        SET user_name = u.name
        FROM users u
        WHERE o.user_id = u.id AND o.user_name IS NULL
    """)


def downgrade() -> None:
    op.drop_column('orders', 'user_name')
