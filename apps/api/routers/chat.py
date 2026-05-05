"""Chat session management router."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import ChatMessage, ChatSession
from schemas import ChatSessionOut

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=ChatSessionOut)
async def create_session(
    language: str = "en",
    db: AsyncSession = Depends(get_db),
) -> ChatSessionOut:
    session = ChatSession(language=language)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return ChatSessionOut.model_validate(session)


@router.get("/sessions/{session_id}", response_model=ChatSessionOut)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ChatSessionOut:
    session = (
        await db.execute(
            select(ChatSession).where(ChatSession.id == session_id)
        )
    ).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = (
        await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
    ).scalars().all()

    result = ChatSessionOut.model_validate(session)
    result.messages = [
        {"id": m.id, "role": m.role, "content": m.content, "sources": m.sources, "created_at": m.created_at}
        for m in messages
    ]
    return result
