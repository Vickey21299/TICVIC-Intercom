from __future__ import annotations

from typing import Any
from .kb_service import KnowledgeBaseService

class IntentRouter:
    """
    Routes based on the detected intent.
    Currently used to determine if we should fetch knowledge base articles.
    """

    def __init__(self, kb_service: KnowledgeBaseService):
        self.kb_service = kb_service

    def route(self, intent: str, message: str) -> dict[str, Any]:
        """
        Takes the intent and message and returns the necessary context for the prompt builder.
        """
        kb_articles = []
        
        if intent not in ['greeting', 'small_talk', 'goodbye']:
            kb_articles = self.kb_service.search_articles(message)
            
        return {
            'kb_articles': kb_articles
        }
