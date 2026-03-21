"""Add call_schedules table for medicine reminder calls

Revision ID: add_call_schedules
Revises: ensure_refill_cols
Create Date: 2026-03-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "add_call_schedules"
down_revision = "ensure_refill_cols"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "call_schedules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("times", sa.String(100), nullable=False),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("audio_url", sa.String(500), nullable=True),
        sa.Column("start_date", sa.String(10), nullable=False),
        sa.Column("end_date", sa.String(10), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("call_schedules")
