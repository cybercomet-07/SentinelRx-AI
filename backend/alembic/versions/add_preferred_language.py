"""add preferred_language to users

Revision ID: add_preferred_language
Revises: add_chat_session_id
Create Date: 2026-03-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_preferred_language"
down_revision: Union[str, Sequence[str], None] = "add_chat_session_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("preferred_language", sa.String(10), nullable=True, server_default="en"))


def downgrade() -> None:
    op.drop_column("users", "preferred_language")
