"""RAG query and streaming endpoints."""
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.rag_pipeline import run_rag_pipeline

router = APIRouter(prefix="/rag", tags=["rag"])


class RAGQueryRequest(BaseModel):
    query: str
    language: str = "en"
    profile: dict[str, Any] | None = None


@router.post("/query")
async def rag_query(request: RAGQueryRequest) -> StreamingResponse:
    """Non-streaming RAG endpoint (collects full response then returns)."""
    return StreamingResponse(
        run_rag_pipeline(
            query=request.query,
            language=request.language,
            profile=request.profile,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/stream")
async def rag_stream(request: RAGQueryRequest) -> StreamingResponse:
    """Streaming SSE endpoint for the chat interface."""
    return StreamingResponse(
        run_rag_pipeline(
            query=request.query,
            language=request.language,
            profile=request.profile,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/translate")
async def translate_text(body: dict[str, str]) -> dict[str, str]:
    """Translate arbitrary text to a target language using Claude."""
    from services.rag_pipeline import _get_anthropic
    from config import settings

    text = body.get("text", "")
    target_language = body.get("target_language", "English")
    if not text:
        return {"translated": ""}

    client = _get_anthropic()
    response = await client.messages.create(
        model=settings.claude_model,
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Translate the following text to {target_language}. "
                    f"Return only the translation, no explanation.\n\n{text}"
                ),
            }
        ],
    )
    return {"translated": response.content[0].text.strip()}
