from __future__ import annotations

from typing import Any
from app.firebase import database

class ConversationService:
    """
    Fetches the history of a conversation.
    """

    def get_history(self, conversation_id: str, limit: int = 15) -> list[dict[str, Any]]:
        """
        Retrieves the last `limit` messages for a given conversation.
        """
        all_messages = database.child('messages').get()
        if not isinstance(all_messages, dict):
            return []

        conv_messages = []
        for msg_id, msg_data in all_messages.items():
            if isinstance(msg_data, dict) and msg_data.get('conversation_id') == conversation_id:
                conv_messages.append(msg_data)

        # Sort chronologically
        conv_messages.sort(key=lambda m: m.get('created_at', ''))

        # Return only the last `limit` messages
        return conv_messages[-limit:]
