"""add delivery address to orders table

Revision ID: add_delivery_address
Revises: add_gender_users
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_delivery_address"
down_revision: Union[str, Sequence[str], None] = "add_gender_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('delivery_address', sa.String(500), nullable=True))
    op.add_column('orders', sa.Column('delivery_latitude', sa.Float(), nullable=True))
    op.add_column('orders', sa.Column('delivery_longitude', sa.Float(), nullable=True))
    op.add_column('orders', sa.Column('address_source', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('orders', 'address_source')
    op.drop_column('orders', 'delivery_longitude')
    op.drop_column('orders', 'delivery_latitude')
    op.drop_column('orders', 'delivery_address')
