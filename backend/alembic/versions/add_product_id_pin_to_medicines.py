"""add product_id and pin to medicines

Revision ID: add_product_pin
Revises: 7eb2e2917cf8
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_product_pin'
down_revision: Union[str, Sequence[str], None] = '7eb2e2917cf8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('medicines', sa.Column('product_id', sa.String(50), nullable=True))
    op.add_column('medicines', sa.Column('pin', sa.String(20), nullable=True))
    op.create_index(op.f('ix_medicines_product_id'), 'medicines', ['product_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_medicines_product_id'), table_name='medicines')
    op.drop_column('medicines', 'pin')
    op.drop_column('medicines', 'product_id')
