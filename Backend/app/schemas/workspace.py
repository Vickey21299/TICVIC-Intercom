from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import BaseResponse


class WorkspaceResponse(BaseModel):
    workspace_id: str
    name: str
    slug: str
    email: str
    plan: str
    status: str
    created_by: str
    created_by_id: str
    created_at: str
    updated_at: str
    custom_domain: str | None = None
    custom_domain_status: str | None = None
    ssl_status: str | None = None
    dns_txt_record: str | None = None
    dns_cname_target: str | None = None


class CustomDomainRequest(BaseModel):
    custom_domain: str


class WorkspaceDetailResponse(BaseResponse):
    workspace: WorkspaceResponse | None = None


class WorkspaceStatsResponse(BaseResponse):
    total_conversations: int = 0
    open_conversations: int = 0
    closed_conversations: int = 0
    pending_conversations: int = 0
    snoozed_conversations: int = 0
    total_agents: int = 0
    total_customers: int = 0
