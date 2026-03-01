import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.exceptions import (
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine 
from app.models import (
    Cart,
    ChatHistory,
    Medicine,
    Notification,
    Order,
    OrderItem,
    Prescription,
    RefillAlert,
    User,
)  # noqa: F401

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Dev bootstrap; use `alembic upgrade head` for production
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:  # pragma: no cover
        logger.warning("Database initialization skipped at startup: %s", exc)
    # Start refill reminder background thread (sends emails 5 days before refill date)
    try:
        from app.tasks.refill_reminder_task import start_refill_reminder_thread
        start_refill_reminder_thread()
    except Exception as exc:  # pragma: no cover
        logger.warning("Refill reminder thread not started: %s", exc)
    yield
    # Shutdown (if needed)


app = FastAPI(title=settings.app_name, lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
# Allow any localhost port for dev (3000, 3001, 3002, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root():
    """Root redirect to docs and health."""
    return {
        "message": "SentinelRx-AI Backend",
        "docs": "/docs",
        "health": "/api/v1/health",
        "openapi": "/openapi.json",
    }

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)
