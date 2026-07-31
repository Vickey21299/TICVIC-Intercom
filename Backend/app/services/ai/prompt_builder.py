from __future__ import annotations

from typing import Any
import os

class PromptBuilder:
    """
    Constructs the final prompt string/array for the LLM.
    """

    def __init__(self, persona_path: str = "app/prompts/support_persona.txt"):
        self.persona_path = persona_path
        self._persona_cache = None

    def _get_persona(self) -> str:
        if self._persona_cache:
            return self._persona_cache
        
        try:
            with open(self.persona_path, "r", encoding="utf-8") as f:
                self._persona_cache = f.read()
        except FileNotFoundError:
            self._persona_cache = "You are a helpful customer support agent."
        return self._persona_cache

    def build(self, message: str, history: list[dict[str, Any]], kb_articles: list[dict[str, Any]]) -> str:
        """
        Builds the unified prompt containing the persona, history, KB, and current message.
        """
        prompt_parts = []

        # 1. System Persona
        prompt_parts.append("### SYSTEM PERSONA ###")
        prompt_parts.append(self._get_persona())
        prompt_parts.append("\n")

        # 2. Knowledge Base
        if kb_articles:
            prompt_parts.append("### KNOWLEDGE BASE ARTICLES ###")
            for i, article in enumerate(kb_articles, start=1):
                prompt_parts.append(f"--- Article {i} ---")
                prompt_parts.append(f"Title: {article.get('title')}")
                prompt_parts.append(f"Category: {article.get('category')}")
                prompt_parts.append(f"Content: {article.get('content')}")
            prompt_parts.append("\n")

        # 3. Conversation History
        if history:
            prompt_parts.append("### CONVERSATION HISTORY ###")
            for msg in history:
                if isinstance(msg, dict):
                    role = msg.get('role') or ('agent' if msg.get('sender_type') == 'agent' else 'chat')
                    content = msg.get('content', '')
                    created_at = msg.get('created_at', '')
                    time_str = f" [{created_at}]" if created_at else ""
                    prompt_parts.append(f'{role}{time_str}: "{content}"')
                elif isinstance(msg, str):
                    prompt_parts.append(f'chat: "{msg}"')
            prompt_parts.append("\n")

        # 4. Current Customer Message
        prompt_parts.append("### CURRENT CUSTOMER MESSAGE ###")
        prompt_parts.append(f"Customer: {message}")
        prompt_parts.append("Agent: ")

        return "\n".join(prompt_parts)
