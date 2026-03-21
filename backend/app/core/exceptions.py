import logging

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# Allowed origins for CORS on error responses (browser blocks without headers)
_ALLOWED_ORIGINS = {"https://sentinelrx-ai.vercel.app", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"}


def _cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin", "")
    allow = origin if origin in _ALLOWED_ORIGINS or "vercel.app" in origin or "localhost" in origin else "https://sentinelrx-ai.vercel.app"
    return {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }


def http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Format HTTPException and similar as consistent JSON."""
    assert isinstance(exc, HTTPException)
    detail = exc.detail
    if isinstance(detail, str):
        body = {"error": {"code": "ERROR", "message": detail}}
    elif isinstance(detail, dict):
        body = {"error": {"code": detail.get("code", "ERROR"), "message": detail.get("message", str(detail))}}
    else:
        body = {"error": {"code": "ERROR", "message": str(detail)}}
    return JSONResponse(status_code=exc.status_code, content=body, headers=_cors_headers(request))


def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Format validation errors as consistent JSON."""
    assert isinstance(exc, RequestValidationError)
    errors = exc.errors()
    messages = [f"{'.'.join(str(loc) for loc in e['loc'])}: {e['msg']}" for e in errors]
    body = {"error": {"code": "VALIDATION_ERROR", "message": "; ".join(messages), "details": errors}}
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=body, headers=_cors_headers(request))


def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled exceptions."""
    logger.exception("Unhandled exception: %s", exc)
    msg = "An unexpected error occurred."
    # Surface known error patterns for easier debugging
    err_str = str(exc).lower()
    if "connection" in err_str or "database" in err_str or "psycopg" in err_str or "password authentication" in err_str:
        msg = "Database connection failed. Ensure PostgreSQL is running and DATABASE_URL in .env is correct."
    elif "operational" in err_str:
        msg = "Database unavailable. Start PostgreSQL and check DATABASE_URL."
    elif "column" in err_str and ("does not exist" in err_str or "reminder_time" in err_str or "call_reminder" in err_str):
        msg = "Database schema outdated. Run: alembic upgrade head"
    body = {"error": {"code": "INTERNAL_ERROR", "message": msg}}
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=body, headers=_cors_headers(request))
