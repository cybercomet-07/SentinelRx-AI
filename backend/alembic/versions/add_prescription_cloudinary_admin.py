"""add prescription cloudinary, user_id, admin_reply, prescription_medicines

Revision ID: add_prescription_admin
Revises: add_separate_chat_tables
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "add_prescription_admin"
down_revision: Union[str, Sequence[str], None] = "add_separate_chat_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("prescriptions", sa.Column("user_id", UUID(as_uuid=True), nullable=True))
    op.add_column("prescriptions", sa.Column("image_url", sa.String(500), nullable=True))
    op.add_column("prescriptions", sa.Column("admin_reply", sa.Text(), nullable=True))
    op.create_foreign_key(
        "fk_prescriptions_user_id", "prescriptions", "users",
        ["user_id"], ["id"], ondelete="CASCADE"
    )
    op.create_index("ix_prescriptions_user_id", "prescriptions", ["user_id"])

    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "prescription_medicines" not in inspector.get_table_names():
        op.create_table(
            "prescription_medicines",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("prescription_id", sa.Integer(), sa.ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("medicine_id", UUID(as_uuid=True), sa.ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        )


def downgrade() -> None:
    op.drop_table("prescription_medicines")
    op.drop_constraint("fk_prescriptions_user_id", "prescriptions", type_="foreignkey")
    op.drop_index("ix_prescriptions_user_id", "prescriptions")
    op.drop_column("prescriptions", "admin_reply")
    op.drop_column("prescriptions", "image_url")
    op.drop_column("prescriptions", "user_id")
