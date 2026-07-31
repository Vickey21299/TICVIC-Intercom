from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import BaseResponse


class ConversationResponse(BaseModel):
    conversation_id: str
    workspace_id: str
    customer_id: str
    assigned_agent: str
    status: str
    channel: str
    priority: str
    created_at: str
    last_message_at: str
    summary: str
    subject: str
    message_count: int
    message_ids: list[str] = []

    # Enriched fields (populated at response time)
    customer_name: str | None = None
    customer_avatar: str | None = None
    agent_name: str | None = None

    # Email threading fields (only for channel="email")
    email_message_id: str | None = None
    email_references: list[str] = []


class ConversationListResponse(BaseResponse):
    conversations: list[ConversationResponse] = []
    total: int = 0


class ConversationDetailResponse(BaseResponse):
    conversation: ConversationResponse | None = None


class ConversationUpdateRequest(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_agent: str | None = None
