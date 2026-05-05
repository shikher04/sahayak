"""Legal rights router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis
from config import settings
from database import get_db, get_redis
from models import Right
from schemas import RightOut

router = APIRouter(tags=["rights"])


@router.get("/rights", response_model=list[RightOut])
async def list_rights(
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> list[RightOut]:
    cache_key = f"rights:{category}"
    cached = await redis.get(cache_key)
    if cached:
        import json
        data = json.loads(cached)
        return [RightOut.model_validate(r) for r in data]

    query = select(Right)
    if category:
        query = query.where(Right.category == category)

    rights = (await db.execute(query)).scalars().all()
    result = [RightOut.model_validate(r) for r in rights]

    import json
    await redis.setex(
        cache_key,
        settings.cache_ttl_seconds,
        json.dumps([r.model_dump(mode="json") for r in result]),
    )
    return result
