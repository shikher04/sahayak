"""Celery task queue for background jobs."""
from celery import Celery

from config import settings

celery_app = Celery(
    "sahayak",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(name="tasks.index_scheme")
def index_scheme(scheme_id: str) -> dict:
    """Re-index a single scheme in Pinecone after update."""
    # Lazy import to avoid loading ML models at import time
    import asyncio
    from packages.embeddings.index_schemes import index_single_scheme  # type: ignore
    result = asyncio.run(index_single_scheme(scheme_id))
    return {"indexed": result}


@celery_app.task(name="tasks.send_notification")
def send_notification(user_id: str, message: str) -> dict:
    """Placeholder for push notifications."""
    return {"sent": True, "user_id": user_id}
