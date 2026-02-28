"""add user profile fields (phone, address, landmark, pin_code, date_of_birth)

Revision ID: add_user_profile
Revises: add_cancelled
Create Date: 2026-02-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_user_profile"
down_revision: Union[str, Sequence[str], None] = "add_cancelled"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('address', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('landmark', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('pin_code', sa.String(10), nullable=True))
    op.add_column('users', sa.Column('date_of_birth', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'date_of_birth')
    op.drop_column('users', 'pin_code')
    op.drop_column('users', 'landmark')
    op.drop_column('users', 'address')
    op.drop_column('users', 'phone')
