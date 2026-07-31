from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import BaseResponse


class ArticleResponse(BaseModel):
    article_id: str
    title: str
    slug: str
    excerpt: str
    body: str
    category: str
    status: str
    created_at: str
    updated_at: str


class ArticleListResponse(BaseResponse):
    articles: list[ArticleResponse] = []
    total: int = 0


class ArticleDetailResponse(BaseResponse):
    article: ArticleResponse | None = None


class ArticleCreateRequest(BaseModel):
    title: str
    excerpt: str
    body: str
    category: str = 'Support'
    status: str = 'Draft'


class ArticleUpdateRequest(BaseModel):
    title: str | None = None
    excerpt: str | None = None
    body: str | None = None
    category: str | None = None
    status: str | None = None
