"""Knowledge Base CRUD endpoints."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.firebase import database
from app.schemas.knowledge_base import (
    ArticleCreateRequest,
    ArticleDetailResponse,
    ArticleListResponse,
    ArticleResponse,
    ArticleUpdateRequest,
)

router = APIRouter(prefix='/api/knowledge-base', tags=['knowledge-base'])
logger = logging.getLogger(__name__)


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={'success': False, 'message': message},
    )


def _slugify(value: str) -> str:
    cleaned = re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
    return cleaned or 'article'


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


# ---------------------------------------------------------------------------
# GET /api/knowledge-base — List all articles
# ---------------------------------------------------------------------------
@router.get('', response_model=ArticleListResponse)
def list_articles() -> ArticleListResponse:
    all_articles = database.child('knowledge_base').get()

    if not isinstance(all_articles, dict):
        return ArticleListResponse(
            success=True, message='No articles found', articles=[], total=0,
        )

    articles = [
        ArticleResponse(**article_data)
        for article_data in all_articles.values()
        if isinstance(article_data, dict)
    ]

    # Sort by created_at descending
    articles.sort(key=lambda a: a.created_at, reverse=True)

    return ArticleListResponse(
        success=True,
        message=f'{len(articles)} articles found',
        articles=articles,
        total=len(articles),
    )


# ---------------------------------------------------------------------------
# GET /api/knowledge-base/{article_id}
# ---------------------------------------------------------------------------
@router.get('/{article_id}', response_model=ArticleDetailResponse)
def get_article(article_id: str) -> ArticleDetailResponse | JSONResponse:
    article_data = database.child('knowledge_base').child(article_id).get()

    if not isinstance(article_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Article not found')

    return ArticleDetailResponse(
        success=True,
        message='Article found',
        article=ArticleResponse(**article_data),
    )


# ---------------------------------------------------------------------------
# GET /api/knowledge-base/slug/{slug}
# ---------------------------------------------------------------------------
@router.get('/slug/{slug}', response_model=ArticleDetailResponse)
def get_article_by_slug(slug: str) -> ArticleDetailResponse | JSONResponse:
    all_articles = database.child('knowledge_base').get()

    if isinstance(all_articles, dict):
        for article in all_articles.values():
            if isinstance(article, dict) and article.get('slug') == slug:
                return ArticleDetailResponse(
                    success=True,
                    message='Article found',
                    article=ArticleResponse(**article),
                )

    return _error(status.HTTP_404_NOT_FOUND, 'Article not found')


# ---------------------------------------------------------------------------
# POST /api/knowledge-base — Create article
# ---------------------------------------------------------------------------
@router.post('', response_model=ArticleDetailResponse)
def create_article(payload: ArticleCreateRequest) -> JSONResponse:
    # Generate next article ID
    all_articles = database.child('knowledge_base').get()
    existing_count = len(all_articles) if isinstance(all_articles, dict) else 0
    article_id = f"article_{existing_count + 1:02d}"

    now = _now_iso()

    new_article = {
        'article_id': article_id,
        'title': payload.title,
        'slug': _slugify(payload.title),
        'excerpt': payload.excerpt,
        'body': payload.body,
        'category': payload.category,
        'status': payload.status,
        'created_at': now,
        'updated_at': now,
    }

    database.child('knowledge_base').child(article_id).set(new_article)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            'success': True,
            'message': 'Article created',
            'article': new_article,
        },
    )


# ---------------------------------------------------------------------------
# PUT /api/knowledge-base/{article_id} — Update article
# ---------------------------------------------------------------------------
@router.put('/{article_id}', response_model=ArticleDetailResponse)
def update_article(
    article_id: str,
    payload: ArticleUpdateRequest,
) -> ArticleDetailResponse | JSONResponse:
    article_data = database.child('knowledge_base').child(article_id).get()

    if not isinstance(article_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Article not found')

    updates: dict = {}
    if payload.title is not None:
        updates['title'] = payload.title
        updates['slug'] = _slugify(payload.title)
    if payload.excerpt is not None:
        updates['excerpt'] = payload.excerpt
    if payload.body is not None:
        updates['body'] = payload.body
    if payload.category is not None:
        updates['category'] = payload.category
    if payload.status is not None:
        updates['status'] = payload.status

    if updates:
        updates['updated_at'] = _now_iso()
        database.child('knowledge_base').child(article_id).update(updates)

    updated = database.child('knowledge_base').child(article_id).get()

    return ArticleDetailResponse(
        success=True,
        message='Article updated',
        article=ArticleResponse(**updated),
    )


# ---------------------------------------------------------------------------
# DELETE /api/knowledge-base/{article_id}
# ---------------------------------------------------------------------------
@router.delete('/{article_id}')
def delete_article(article_id: str) -> JSONResponse:
    article_data = database.child('knowledge_base').child(article_id).get()

    if not isinstance(article_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Article not found')

    database.child('knowledge_base').child(article_id).delete()

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            'success': True,
            'message': 'Article deleted',
        },
    )
