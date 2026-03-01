"""add separate chat history tables for each AI feature

Revision ID: add_separate_chat_tables
Revises: add_chat_agent_email
Create Date: 2026-02-25

Creates:
- order_medicine_ai_chat_history (Order Medicine AI)
- general_talk_chat_history (General Talk Suggestion AI / SentinelRX-AI)
- symptom_suggestion_chat_history (Symptom Suggestions No Prescription)

Drops old chat_history table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

revision: str = "add_separate_chat_tables"
down_revision: Union[str, Sequence[str], None] = "add_chat_agent_email"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create order_medicine_ai_chat_history
    op.create_table(
        "order_medicine_ai_chat_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_email", sa.String(255), nullable=True, index=True),
        sa.Column("user_message", sa.Text(), nullable=False),
        sa.Column("ai_response", JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Create general_talk_chat_history
    op.create_table(
        "general_talk_chat_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_email", sa.String(255), nullable=True, index=True),
        sa.Column("user_message", sa.Text(), nullable=False),
        sa.Column("ai_response", JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Create symptom_suggestion_chat_history
    op.create_table(
        "symptom_suggestion_chat_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_email", sa.String(255), nullable=True, index=True),
        sa.Column("user_message", sa.Text(), nullable=False),
        sa.Column("ai_response", JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Migrate existing data from chat_history to new tables (if chat_history exists)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "chat_history" in inspector.get_table_names():
        # Migrate order_agent -> order_medicine_ai_chat_history
        op.execute(sa.text("""
            INSERT INTO order_medicine_ai_chat_history (id, user_id, user_email, user_message, ai_response, created_at)
            SELECT id, user_id, user_email, user_message, ai_response, created_at
            FROM chat_history WHERE agent_type = 'order_agent'
        """))
        # Migrate symptom_agent -> general_talk_chat_history
        op.execute(sa.text("""
            INSERT INTO general_talk_chat_history (id, user_id, user_email, user_message, ai_response, created_at)
            SELECT id, user_id, user_email, user_message, ai_response, created_at
            FROM chat_history WHERE agent_type = 'symptom_agent'
        """))
        # Migrate prescription_agent -> symptom_suggestion_chat_history
        op.execute(sa.text("""
            INSERT INTO symptom_suggestion_chat_history (id, user_id, user_email, user_message, ai_response, created_at)
            SELECT id, user_id, user_email, user_message, ai_response, created_at
            FROM chat_history WHERE agent_type = 'prescription_agent'
        """))
        # Handle rows with NULL agent_type (legacy) -> order_medicine_ai_chat_history
        op.execute(sa.text("""
            INSERT INTO order_medicine_ai_chat_history (id, user_id, user_email, user_message, ai_response, created_at)
            SELECT id, user_id, user_email, user_message, ai_response, created_at
            FROM chat_history WHERE agent_type IS NULL OR agent_type NOT IN ('order_agent', 'symptom_agent', 'prescription_agent')
        """))
        op.drop_table("chat_history")


def downgrade() -> None:
    op.create_table(
        "chat_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_email", sa.String(255), nullable=True, index=True),
        sa.Column("agent_type", sa.String(50), nullable=True, server_default="order_agent"),
        sa.Column("user_message", sa.Text(), nullable=False),
        sa.Column("ai_response", JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.drop_table("symptom_suggestion_chat_history")
    op.drop_table("general_talk_chat_history")
    op.drop_table("order_medicine_ai_chat_history")
