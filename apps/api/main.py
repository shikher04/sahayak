"""Sahayak FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import auth, chat, eligibility, profile, rag, rights, schemes


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Sahayak API",
    description="Government Schemes & Legal Rights Awareness Platform for India",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(schemes.router, prefix="/api")
app.include_router(rights.router, prefix="/api")
app.include_router(eligibility.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(rag.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/api/health")
async def health_check() -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "sahayak-api"})
