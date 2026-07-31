"""Utility to fetch the current user's profile and role from Firebase RTDB."""

from __future__ import annotations

import logging
from typing import Any

from app.firebase import database

logger = logging.getLogger(__name__)


def get_current_user(user_id: str) -> dict[str, Any] | None:
    """Fetch user profile from RTDB and return it, or None if not found."""
    user_data = database.child('users').child(user_id).get()

    if not user_data or not isinstance(user_data, dict):
        logger.warning('User not found in RTDB: user_id=%s', user_id)
        return None

    return user_data


def is_admin(user_data: dict[str, Any]) -> bool:
    """Check if the user has admin role."""
    return user_data.get('role') == 'admin'


def is_agent(user_data: dict[str, Any]) -> bool:
    """Check if the user has agent role."""
    return user_data.get('role') == 'agent'
