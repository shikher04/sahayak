"""Pydantic schemas for chat endpoints."""
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class NewChatMessage(BaseModel):
    query: str
    language: str = "en"
    session_id: uuid.UUID | None = None
    profile: dict[str, Any] | None = None


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    content: str
    sources: list[Any]
    created_at: datetime


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    language: str
    created_at: datetime
    messages: list[ChatMessageOut] = []
