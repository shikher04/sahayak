"""User profile router."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Profile, User
from schemas import ProfileIn, ProfileOut
from services.auth_service import decode_jwt

router = APIRouter(tags=["profile"])


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ")
    payload = decode_jwt(token)
    uid_token = payload.get("uid_token")
    if not uid_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = (
        await db.execute(select(User).where(User.uid_token == uid_token))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/profile", response_model=ProfileOut)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileOut:
    profile = (
        await db.execute(
            select(Profile).where(Profile.user_id == current_user.id)
        )
    ).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileOut.model_validate(profile)


@router.post("/profile", response_model=ProfileOut)
async def upsert_profile(
    data: ProfileIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileOut:
    profile = (
        await db.execute(
            select(Profile).where(Profile.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if profile:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
    else:
        profile = Profile(user_id=current_user.id, **data.model_dump(exclude_unset=True))
        db.add(profile)

    await db.flush()
    await db.refresh(profile)
    return ProfileOut.model_validate(profile)
