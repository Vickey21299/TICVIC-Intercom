from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import BaseResponse


class CustomerResponse(BaseModel):
    customer_id: str
    name: str
    email: str
    avatar: str
    created_at: str


class CustomerListResponse(BaseResponse):
    customers: list[CustomerResponse] = []
    total: int = 0


class CustomerDetailResponse(BaseResponse):
    customer: CustomerResponse | None = None
