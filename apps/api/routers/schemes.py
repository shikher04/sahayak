"""Schemes CRUD router."""
import json
import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis
from database import get_db, get_redis
from models import Scheme
from schemas import SchemeListResponse, SchemeOut
from config import settings

router = APIRouter(tags=["schemes"])

CACHE_KEY_PREFIX = "schemes:"


@router.get("/schemes", response_model=SchemeListResponse)
async def list_schemes(
    category: str | None = Query(None),
    state: str | None = Query(None),
    level: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> SchemeListResponse:
    cache_key = f"{CACHE_KEY_PREFIX}{category}:{state}:{level}:{page}:{limit}"

    cached = await redis.get(cache_key)
    if cached:
        return SchemeListResponse.model_validate_json(cached)

    query = select(Scheme).where(Scheme.is_active == True)  # noqa: E712
    count_query = select(func.count()).select_from(Scheme).where(Scheme.is_active == True)  # noqa: E712

    if category:
        query = query.where(Scheme.category == category)
        count_query = count_query.where(Scheme.category == category)
    if state:
        query = query.where(Scheme.state_code == state)
        count_query = count_query.where(Scheme.state_code == state)
    if level:
        query = query.where(Scheme.level == level)
        count_query = count_query.where(Scheme.level == level)

    total = (await db.execute(count_query)).scalar_one()
    offset = (page - 1) * limit
    schemes = (await db.execute(query.offset(offset).limit(limit))).scalars().all()

    response = SchemeListResponse(
        items=[SchemeOut.model_validate(s) for s in schemes],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )
    await redis.setex(cache_key, settings.cache_ttl_seconds, response.model_dump_json())
    return response


@router.get("/schemes/{scheme_id}", response_model=SchemeOut)
async def get_scheme(
    scheme_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> SchemeOut:
    cache_key = f"{CACHE_KEY_PREFIX}id:{scheme_id}"
    cached = await redis.get(cache_key)
    if cached:
        return SchemeOut.model_validate_json(cached)

    scheme = (
        await db.execute(select(Scheme).where(Scheme.id == scheme_id))
    ).scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    out = SchemeOut.model_validate(scheme)
    await redis.setex(cache_key, settings.cache_ttl_seconds, out.model_dump_json())
    return out
