"""add gender to users table

Revision ID: add_gender_users
Revises: add_order_user_name
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_gender_users"
down_revision: Union[str, Sequence[str], None] = "add_order_user_name"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('gender', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'gender')
