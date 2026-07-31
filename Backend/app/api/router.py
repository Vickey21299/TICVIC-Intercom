from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.conversations import router as conversations_router
from app.api.messages import router as messages_router
from app.api.customers import router as customers_router
from app.api.agents import router as agents_router
from app.api.workspace import router as workspace_router
from app.api.knowledge_base import router as knowledge_base_router
from app.api.ai import router as ai_router
from app.api.email_api import router as email_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(conversations_router)
api_router.include_router(messages_router)
api_router.include_router(customers_router)
api_router.include_router(agents_router)
api_router.include_router(workspace_router)
api_router.include_router(knowledge_base_router)
api_router.include_router(ai_router)
api_router.include_router(email_router)
