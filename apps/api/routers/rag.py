"""RAG query and streaming endpoints."""
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.rag_pipeline import run_rag_pipeline, _get_groq, _translate_to_english
from config import settings

router = APIRouter(prefix="/rag", tags=["rag"])


class HistoryMessage(BaseModel):
    role: str
    content: str


class RAGQueryRequest(BaseModel):
    query: str
    language: str = "en"
    profile: dict[str, Any] | None = None
    history: list[HistoryMessage] | None = None


@router.post("/query")
async def rag_query(request: RAGQueryRequest) -> StreamingResponse:
    """Non-streaming RAG endpoint (collects full response then returns)."""
    return StreamingResponse(
        run_rag_pipeline(
            query=request.query,
            language=request.language,
            profile=request.profile,
            history=[m.model_dump() for m in request.history] if request.history else None,
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
            history=[m.model_dump() for m in request.history] if request.history else None,
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
    """Translate arbitrary text to a target language using Groq."""
    text = body.get("text", "")
    target_language = body.get("target_language", "English")
    if not text:
        return {"translated": ""}

    if settings.llm_provider == "groq" and settings.groq_api_key:
        client = _get_groq()
        response = await client.chat.completions.create(
            model=settings.groq_model,
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
        return {"translated": response.choices[0].message.content.strip()}

    # Fallback: return original text if no LLM available
    return {"translated": text}
