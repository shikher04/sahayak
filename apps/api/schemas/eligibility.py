"""Pydantic schemas for eligibility checker."""
from typing import Any, Literal

from pydantic import BaseModel, Field


class EligibilityRequest(BaseModel):
    occupation: str
    annual_income: str
    caste_category: Literal["general", "obc", "sc", "st", "ews"]
    has_land: bool
    state: str | None = None
    age: int | None = Field(None, ge=0, le=130)
    gender: Literal["male", "female", "other"] | None = None


class MatchedScheme(BaseModel):
    scheme_id: str
    name: str
    ministry: str
    category: str
    benefit_amount: str | None
    confidence_score: float = Field(ge=0.0, le=1.0)
    match_reasons: list[str]
    application_url: str | None
