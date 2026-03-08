"""add chat_session_id to agent history tables

Revision ID: add_chat_session_id
Revises: add_chat_sessions
Create Date: 2026-03-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_chat_session_id"
down_revision: Union[str, Sequence[str], None] = "add_chat_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("general_talk_chat_history", sa.Column("chat_session_id", sa.String(64), nullable=True, index=True))
    op.add_column("order_medicine_ai_chat_history", sa.Column("chat_session_id", sa.String(64), nullable=True, index=True))
    op.add_column("general_talk_chat_history", sa.Column("agent_type", sa.String(32), nullable=True, server_default="sentinelrx"))
    op.add_column("order_medicine_ai_chat_history", sa.Column("agent_type", sa.String(32), nullable=True, server_default="order"))


def downgrade() -> None:
    op.drop_column("general_talk_chat_history", "agent_type")
    op.drop_column("order_medicine_ai_chat_history", "agent_type")
    op.drop_column("general_talk_chat_history", "chat_session_id")
    op.drop_column("order_medicine_ai_chat_history", "chat_session_id")
