"""Unified Inbox — Conversation endpoints with role-based filtering."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse

from app.firebase import database
from app.schemas.common import BaseResponse
from app.schemas.conversations import (
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationResponse,
    ConversationUpdateRequest,
)
from app.schemas.messages import (
    MessageListResponse,
    MessageResponse,
    SendMessageRequest,
)
from app.utils.auth import get_current_user, is_admin

router = APIRouter(prefix='/api/conversations', tags=['conversations'])
logger = logging.getLogger(__name__)


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={'success': False, 'message': message},
    )


def _enrich_conversation(conv: dict) -> dict:
    """Add customer_name, customer_avatar, agent_name to a conversation dict."""
    customer_id = conv.get('customer_id')
    agent_id = conv.get('assigned_agent')

    if customer_id:
        customer = database.child('customers').child(customer_id).get()
        if isinstance(customer, dict):
            conv['customer_name'] = customer.get('name')
            conv['customer_avatar'] = customer.get('avatar')

    if agent_id:
        agent = database.child('users').child(agent_id).get()
        if isinstance(agent, dict):
            conv['agent_name'] = agent.get('name')

    return conv


# ---------------------------------------------------------------------------
# GET /api/conversations — Unified Inbox
# ---------------------------------------------------------------------------
@router.get('', response_model=ConversationListResponse)
def list_conversations(
    user_id: str = Query(..., description='Caller user ID (admin or agent)'),
    status_filter: str | None = Query(default=None, alias='status'),
    channel: str | None = Query(default=None),
    priority: str | None = Query(default=None),
) -> ConversationListResponse | JSONResponse:
    caller = get_current_user(user_id)
    if not caller:
        return _error(status.HTTP_401_UNAUTHORIZED, 'User not found')

    all_conversations = database.child('conversations').get()
    if not isinstance(all_conversations, dict):
        return ConversationListResponse(
            success=True, message='No conversations found', conversations=[], total=0,
        )

    filtered: list[dict] = []

    for conv_id, conv_data in all_conversations.items():
        if not isinstance(conv_data, dict):
            continue

        # --- Role-based filtering ---
        if not is_admin(caller):
            if conv_data.get('assigned_agent') != user_id:
                continue

        # --- Optional query filters ---
        if status_filter and conv_data.get('status') != status_filter:
            continue
        if channel and conv_data.get('channel') != channel:
            continue
        if priority and conv_data.get('priority') != priority:
            continue

        filtered.append(_enrich_conversation(conv_data))

    # Sort by last_message_at descending (newest first)
    filtered.sort(key=lambda c: c.get('last_message_at', ''), reverse=True)

    return ConversationListResponse(
        success=True,
        message=f'{len(filtered)} conversations found',
        conversations=[ConversationResponse(**c) for c in filtered],
        total=len(filtered),
    )


# ---------------------------------------------------------------------------
# GET /api/conversations/{conversation_id}
# ---------------------------------------------------------------------------
@router.get('/{conversation_id}', response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: str,
    user_id: str = Query(..., description='Caller user ID'),
) -> ConversationDetailResponse | JSONResponse:
    caller = get_current_user(user_id)
    if not caller:
        return _error(status.HTTP_401_UNAUTHORIZED, 'User not found')

    conv_data = database.child('conversations').child(conversation_id).get()
    if not isinstance(conv_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Conversation not found')

    # Access check: agent can only view their own conversations
    if not is_admin(caller) and conv_data.get('assigned_agent') != user_id:
        return _error(status.HTTP_403_FORBIDDEN, 'Access denied')

    enriched = _enrich_conversation(conv_data)

    return ConversationDetailResponse(
        success=True,
        message='Conversation found',
        conversation=ConversationResponse(**enriched),
    )


# ---------------------------------------------------------------------------
# PUT /api/conversations/{conversation_id}
# ---------------------------------------------------------------------------
@router.put('/{conversation_id}', response_model=ConversationDetailResponse)
def update_conversation(
    conversation_id: str,
    payload: ConversationUpdateRequest,
    user_id: str = Query(..., description='Caller user ID'),
) -> ConversationDetailResponse | JSONResponse:
    caller = get_current_user(user_id)
    if not caller:
        return _error(status.HTTP_401_UNAUTHORIZED, 'User not found')

    conv_data = database.child('conversations').child(conversation_id).get()
    if not isinstance(conv_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Conversation not found')

    if not is_admin(caller) and conv_data.get('assigned_agent') != user_id:
        return _error(status.HTTP_403_FORBIDDEN, 'Access denied')

    updates: dict = {}
    if payload.status is not None:
        updates['status'] = payload.status
    if payload.priority is not None:
        updates['priority'] = payload.priority
    if payload.assigned_agent is not None:
        updates['assigned_agent'] = payload.assigned_agent

    if updates:
        database.child('conversations').child(conversation_id).update(updates)

    updated = database.child('conversations').child(conversation_id).get()
    enriched = _enrich_conversation(updated)

    return ConversationDetailResponse(
        success=True,
        message='Conversation updated',
        conversation=ConversationResponse(**enriched),
    )


# ---------------------------------------------------------------------------
# GET /api/conversations/{conversation_id}/messages
# ---------------------------------------------------------------------------
@router.get('/{conversation_id}/messages', response_model=MessageListResponse)
def list_conversation_messages(
    conversation_id: str,
    user_id: str = Query(..., description='Caller user ID'),
) -> MessageListResponse | JSONResponse:
    caller = get_current_user(user_id)
    if not caller:
        return _error(status.HTTP_401_UNAUTHORIZED, 'User not found')

    conv_data = database.child('conversations').child(conversation_id).get()
    if not isinstance(conv_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Conversation not found')

    if not is_admin(caller) and conv_data.get('assigned_agent') != user_id:
        return _error(status.HTTP_403_FORBIDDEN, 'Access denied')

    # Fetch messages and filter by conversation_id
    all_messages = database.child('messages').get()
    if not isinstance(all_messages, dict):
        return MessageListResponse(
            success=True, message='No messages found', messages=[], total=0,
        )

    conv_messages: list[dict] = []
    for msg_id, msg_data in all_messages.items():
        if isinstance(msg_data, dict) and msg_data.get('conversation_id') == conversation_id:
            conv_messages.append(msg_data)

    # Sort by created_at ascending (chronological order)
    conv_messages.sort(key=lambda m: m.get('created_at', ''))

    return MessageListResponse(
        success=True,
        message=f'{len(conv_messages)} messages found',
        messages=[MessageResponse(**m) for m in conv_messages],
        total=len(conv_messages),
    )


# ---------------------------------------------------------------------------
# POST /api/conversations/{conversation_id}/messages — Send a message
# ---------------------------------------------------------------------------
@router.post('/{conversation_id}/messages', response_model=MessageListResponse)
def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    user_id: str = Query(..., description='Caller user ID'),
) -> JSONResponse:
    caller = get_current_user(user_id)
    if not caller:
        return _error(status.HTTP_401_UNAUTHORIZED, 'User not found')

    conv_data = database.child('conversations').child(conversation_id).get()
    if not isinstance(conv_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Conversation not found')

    if not is_admin(caller) and conv_data.get('assigned_agent') != user_id:
        return _error(status.HTTP_403_FORBIDDEN, 'Access denied')

    # -----------------------------------------------------------------------
    # EMAIL CHANNEL: send reply via SMTP + store via email_firebase_service
    # -----------------------------------------------------------------------
    if conv_data.get('channel') == 'email':
        try:
            from app.services.email.email_firebase_service import process_outbound_reply

            result = process_outbound_reply(
                conversation_id=conversation_id,
                sender_id=payload.sender_id,
                sender_name=payload.sender_name,
                content=payload.content,
            )
            return JSONResponse(
                status_code=status.HTTP_201_CREATED,
                content={
                    'success': True,
                    'message': 'Email reply sent',
                    'data': {
                        'message_id': result['message_id'],
                        'smtp_message_id': result['smtp_message_id'],
                    },
                },
            )
        except Exception as exc:
            logger.exception('Failed to send email reply: %s', exc)
            return _error(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f'Failed to send email reply: {exc}',
            )

    # -----------------------------------------------------------------------
    # CHAT CHANNEL: original behaviour (store message in Firebase only)
    # -----------------------------------------------------------------------
    message_count = conv_data.get('message_count', 0) + 1
    message_id = f"msg_{conversation_id}_{message_count:02d}"
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')

    new_message = {
        'message_id': message_id,
        'conversation_id': conversation_id,
        'workspace_id': conv_data.get('workspace_id', ''),
        'sender_type': payload.sender_type,
        'sender_id': payload.sender_id,
        'sender_name': payload.sender_name,
        'content': payload.content,
        'created_at': now,
    }

    # Write message to RTDB
    database.child('messages').child(message_id).set(new_message)

    # Update conversation metadata
    message_ids = conv_data.get('message_ids', [])
    message_ids.append(message_id)
    database.child('conversations').child(conversation_id).update({
        'message_count': message_count,
        'message_ids': message_ids,
        'last_message_at': now,
    })

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            'success': True,
            'message': 'Message sent',
            'data': new_message,
        },
    )
