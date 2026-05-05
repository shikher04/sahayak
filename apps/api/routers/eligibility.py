"""Eligibility checker router."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Scheme
from schemas import EligibilityRequest, MatchedScheme

router = APIRouter(tags=["eligibility"])

OCCUPATION_MAP: dict[str, list[str]] = {
    "farmer": ["agriculture", "insurance"],
    "street_vendor": ["loan", "welfare"],
    "student": ["education", "welfare"],
    "unemployed": ["employment", "welfare"],
    "business": ["loan"],
    "salaried": ["pension", "insurance", "savings"],
    "self_employed": ["loan", "pension", "insurance"],
}

INCOME_BRACKETS = {
    "below_50k": ["below_poverty_line", "low_income", "ews", "lig"],
    "50k_1l": ["low_income", "ews", "lig"],
    "1l_3l": ["ews", "lig"],
    "3l_6l": ["lig"],
    "6l_12l": ["mig"],
    "above_12l": [],
}


def _compute_confidence(scheme: Scheme, request: EligibilityRequest) -> tuple[float, list[str]]:
    """Return (confidence_score, match_reasons) for a scheme given a request."""
    score = 0.0
    reasons: list[str] = []

    occ_categories = OCCUPATION_MAP.get(request.occupation.lower(), [])
    if scheme.category in occ_categories:
        score += 0.4
        reasons.append(f"Matches your occupation ({request.occupation})")

    criteria = scheme.eligibility_criteria

    if request.caste_category in ("sc", "st", "obc", "ews"):
        if "caste_category" in criteria or scheme.category == "education":
            score += 0.2
            reasons.append(f"Priority for {request.caste_category.upper()} category")

    if request.has_land and criteria.get("land_ownership"):
        score += 0.2
        reasons.append("Land ownership is a qualifying criterion")

    if request.gender == "female" and scheme.category == "welfare":
        score += 0.15
        reasons.append("Priority for women beneficiaries")

    if scheme.level == "central":
        score += 0.05
        reasons.append("Central government scheme (nationwide)")

    if request.state and scheme.state_code == request.state:
        score += 0.1
        reasons.append(f"State scheme for {request.state}")

    return min(score, 1.0), reasons


@router.post("/eligibility/check", response_model=list[MatchedScheme])
async def check_eligibility(
    request: EligibilityRequest,
    db: AsyncSession = Depends(get_db),
) -> list[MatchedScheme]:
    schemes = (
        await db.execute(select(Scheme).where(Scheme.is_active == True))  # noqa: E712
    ).scalars().all()

    results: list[MatchedScheme] = []
    for scheme in schemes:
        confidence, reasons = _compute_confidence(scheme, request)
        if confidence >= 0.3:
            results.append(
                MatchedScheme(
                    scheme_id=str(scheme.id),
                    name=scheme.name,
                    ministry=scheme.ministry,
                    category=scheme.category,
                    benefit_amount=scheme.benefit_amount,
                    confidence_score=round(confidence, 2),
                    match_reasons=reasons,
                    application_url=scheme.application_url,
                )
            )

    return sorted(results, key=lambda x: x.confidence_score, reverse=True)
