"""Pydantic schemas for scheme endpoints."""
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class SchemeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    ministry: str
    category: str
    level: str
    state_code: str | None
    description: str
    benefit_amount: str | None
    eligibility_criteria: dict[str, Any]
    required_documents: list[Any]
    application_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SchemeListResponse(BaseModel):
    items: list[SchemeOut]
    total: int
    page: int
    limit: int
    pages: int
