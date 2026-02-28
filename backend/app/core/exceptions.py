from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


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
    return JSONResponse(status_code=exc.status_code, content=body)


def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Format validation errors as consistent JSON."""
    assert isinstance(exc, RequestValidationError)
    errors = exc.errors()
    messages = [f"{'.'.join(str(loc) for loc in e['loc'])}: {e['msg']}" for e in errors]
    body = {"error": {"code": "VALIDATION_ERROR", "message": "; ".join(messages), "details": errors}}
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=body)


def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled exceptions."""
    msg = "An unexpected error occurred."
    # In development, surface DB/connection errors so user can fix them
    err_str = str(exc).lower()
    if "connection" in err_str or "database" in err_str or "psycopg" in err_str or "password authentication" in err_str:
        msg = "Database connection failed. Ensure PostgreSQL is running and DATABASE_URL in .env is correct."
    elif "operational" in err_str:
        msg = "Database unavailable. Start PostgreSQL and check DATABASE_URL."
    body = {"error": {"code": "INTERNAL_ERROR", "message": msg}}
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=body)
