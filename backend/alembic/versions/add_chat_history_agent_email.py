"""add agent_type and user_email to chat_history

Revision ID: add_chat_agent_email
Revises: add_medicine_indications
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_chat_agent_email"
down_revision: Union[str, Sequence[str], None] = "add_medicine_indications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("chat_history", sa.Column("agent_type", sa.String(50), nullable=True, server_default="order_agent"))
    op.add_column("chat_history", sa.Column("user_email", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("chat_history", "user_email")
    op.drop_column("chat_history", "agent_type")
