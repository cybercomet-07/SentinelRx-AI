"""
Separate chat history tables for each AI feature.
Stores user chat + AI reply with user email and timestamp.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OrderMedicineAiChatHistory(Base):
    """Chat history for Order Medicine AI - ordering medicines via chat. Separate table for order agent."""

    __tablename__ = "order_medicine_ai_chat_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    user_message: Mapped[str] = mapped_column(Text, nullable=False)
    ai_response: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    chat_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    agent_type: Mapped[str | None] = mapped_column(String(32), nullable=True, default="order")


class GeneralTalkChatHistory(Base):
    """Chat history for General Talk Suggestion AI (SentinelRX-AI) - health advice, symptom suggestions. Separate table for SentinelRX-AI."""

    __tablename__ = "general_talk_chat_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    user_message: Mapped[str] = mapped_column(Text, nullable=False)
    ai_response: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    chat_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    agent_type: Mapped[str | None] = mapped_column(String(32), nullable=True, default="sentinelrx")


class SymptomSuggestionChatHistory(Base):
    """Chat history for Symptom Suggestions (No Prescription) - medicine recommendations without prescription."""

    __tablename__ = "symptom_suggestion_chat_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    user_message: Mapped[str] = mapped_column(Text, nullable=False)
    ai_response: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
