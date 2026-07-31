"""Email API — admin-only endpoints for email polling management."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse

from app.utils.auth import get_current_user, is_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/email", tags=["email"])

# The poller instance is set by main.py on startup
_poller = None


def set_poller(poller) -> None:  # noqa: ANN001
    """Called by main.py to inject the active poller instance."""
    global _poller
    _poller = poller


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message},
    )


@router.get("/status")
def email_poller_status(
    user_id: str = Query(..., description="Caller user ID (admin only)"),
) -> JSONResponse:
    """Check whether the email poller is currently running."""
    caller = get_current_user(user_id)
    if not caller or not is_admin(caller):
        return _error(status.HTTP_403_FORBIDDEN, "Admin access required")

    running = _poller.is_running if _poller else False
    interval = _poller.interval if _poller else 0

    return JSONResponse(
        content={
            "success": True,
            "poller_running": running,
            "poll_interval_seconds": interval,
        }
    )


@router.post("/poll")
def trigger_email_poll(
    user_id: str = Query(..., description="Caller user ID (admin only)"),
) -> JSONResponse:
    """Manually trigger an immediate email poll cycle."""
    caller = get_current_user(user_id)
    if not caller or not is_admin(caller):
        return _error(status.HTTP_403_FORBIDDEN, "Admin access required")

    if not _poller:
        return _error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Email poller is not initialised.",
        )

    processed = _poller.poll_once()

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": f"Poll complete. {processed} email(s) processed.",
            "processed": processed,
        },
    )
