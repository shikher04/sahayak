"""Pydantic schemas for user profile."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ProfileIn(BaseModel):
    state: str | None = None
    age: int | None = Field(None, ge=0, le=130)
    gender: Literal["male", "female", "other"] | None = None
    annual_income: str | None = None
    caste_category: Literal["general", "obc", "sc", "st", "ews"] | None = None
    occupation: str | None = None
    has_land: bool | None = None
    land_area_hectares: float | None = Field(None, ge=0)


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    state: str | None
    age: int | None
    gender: str | None
    annual_income: str | None
    caste_category: str | None
    occupation: str | None
    has_land: bool | None
    land_area_hectares: float | None
    updated_at: datetime
