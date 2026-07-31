from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import BaseResponse


class AgentResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    workspace_id: str
    online: bool
    avatar: str
    assigned_conversations: list[str] = []
    created_at: str | None = None


class AgentListResponse(BaseResponse):
    agents: list[AgentResponse] = []
    total: int = 0


class AgentDetailResponse(BaseResponse):
    agent: AgentResponse | None = None


class AgentStatusUpdate(BaseModel):
    online: bool
