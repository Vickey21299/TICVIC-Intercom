from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import BaseResponse


class MessageResponse(BaseModel):
    message_id: str
    conversation_id: str
    workspace_id: str
    sender_type: str
    sender_id: str
    sender_name: str
    content: str
    created_at: str
    channel: str = "chat"
    email_message_id: str | None = None


class MessageListResponse(BaseResponse):
    messages: list[MessageResponse] = []
    total: int = 0


class MessageDetailResponse(BaseResponse):
    data: MessageResponse | None = None


class SendMessageRequest(BaseModel):
    sender_type: str
    sender_id: str
    sender_name: str
    content: str
