import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

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
    GeneralTalkChatHistory,
    Medicine,
    Notification,
    Order,
    OrderItem,
    OrderMedicineAiChatHistory,
    Prescription,
    RefillAlert,
    SymptomSuggestionChatHistory,
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
    # Seed medicine indications (keyword-based uses for symptom recommendations)
    try:
        from app.db.seed_medicine_indications import seed_indications
        seed_indications()
        logger.info("Medicine indications seeded")
    except Exception as exc:  # pragma: no cover
        logger.warning("Medicine indications seed skipped: %s", exc)
    # Seed 27 beds per hospital admin (ensures available beds for dashboard)
    try:
        from app.db.seed_hospital_beds import seed_hospital_beds
        seed_hospital_beds()
        logger.info("Hospital beds seeded")
    except Exception as exc:  # pragma: no cover
        logger.warning("Hospital beds seed skipped: %s", exc)
    # Start refill reminder background thread (sends emails 5 days before refill date)
    try:
        from app.tasks.refill_reminder_task import start_refill_reminder_thread
        start_refill_reminder_thread()
    except Exception as exc:  # pragma: no cover
        logger.warning("Refill reminder thread not started: %s", exc)
    # Start refill call thread (Twilio calls at reminder_time on refill date)
    try:
        from app.tasks.refill_call_task import start_refill_call_thread
        start_refill_call_thread()
    except Exception as exc:  # pragma: no cover
        logger.warning("Refill call thread not started: %s", exc)
    # Start call schedule thread (Twilio calls at user-specified times)
    try:
        from app.tasks.call_schedule_task import start_call_schedule_thread
        start_call_schedule_thread()
    except Exception as exc:  # pragma: no cover
        logger.warning("Call schedule thread not started: %s", exc)
    yield
    # Shutdown (if needed)


app = FastAPI(title=settings.app_name, lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
# Ensure production Vercel frontend is always allowed
_vercel_prod = "https://sentinelrx-ai.vercel.app"
if _vercel_prod not in origins:
    origins.append(_vercel_prod)
# CORS: allow Vercel frontend + localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


class AddCORSHeadersMiddleware(BaseHTTPMiddleware):
    """Ensure CORS headers on all responses (fallback if CORSMiddleware misses)."""

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        origin = request.headers.get("origin", "")
        if origin and ("vercel.app" in origin or "localhost" in origin or "127.0.0.1" in origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response


app.add_middleware(AddCORSHeadersMiddleware)

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
