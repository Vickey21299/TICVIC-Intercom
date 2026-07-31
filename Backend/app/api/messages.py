"""Single-message lookup endpoint."""

from __future__ import annotations

import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.firebase import database
from app.schemas.messages import MessageDetailResponse, MessageResponse

router = APIRouter(prefix='/api/messages', tags=['messages'])
logger = logging.getLogger(__name__)


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={'success': False, 'message': message},
    )


@router.get('/{message_id}', response_model=MessageDetailResponse)
def get_message(message_id: str) -> MessageDetailResponse | JSONResponse:
    msg_data = database.child('messages').child(message_id).get()

    if not isinstance(msg_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Message not found')

    return MessageDetailResponse(
        success=True,
        message='Message found',
        data=MessageResponse(**msg_data),
    )
