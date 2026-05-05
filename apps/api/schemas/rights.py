"""Pydantic schemas for rights endpoints."""
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class RightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    category: str
    description: str
    articles: list[Any]
    action_steps: list[Any]
    created_at: datetime
