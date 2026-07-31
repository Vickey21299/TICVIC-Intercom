from __future__ import annotations

from typing import Any
from pydantic import BaseModel


class AIChatRequest(BaseModel):
    conversation_id: str
    message: str
    customer_id: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    customer_avatar: str | None = None


class AIChatResponse(BaseModel):
    reply: str
    intent: str
    entities: dict[str, Any]
    kb_used: list[dict[str, Any]]
    confidence: float


class AISummaryRequest(BaseModel):
    conversation_id: str


class AISummaryResponse(BaseModel):
    summary: str

