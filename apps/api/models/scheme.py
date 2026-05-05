"""Government scheme and saved-scheme models."""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), index=True)
    ministry: Mapped[str] = mapped_column(String(150))
    category: Mapped[str] = mapped_column(String(50), index=True)
    level: Mapped[str] = mapped_column(String(10), default="central")
    state_code: Mapped[str | None] = mapped_column(String(5), index=True)
    description: Mapped[str] = mapped_column(Text)
    benefit_amount: Mapped[str | None] = mapped_column(String(100))
    eligibility_criteria: Mapped[dict] = mapped_column(JSONB, default=dict)
    required_documents: Mapped[list] = mapped_column(JSONB, default=list)
    application_url: Mapped[str | None] = mapped_column(String(300))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    saved_by: Mapped[list["SavedScheme"]] = relationship(back_populates="scheme")


class SavedScheme(Base):
    __tablename__ = "saved_schemes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    scheme_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schemes.id", ondelete="CASCADE"), index=True
    )
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="saved_schemes")  # noqa: F821
    scheme: Mapped["Scheme"] = relationship(back_populates="saved_by")
