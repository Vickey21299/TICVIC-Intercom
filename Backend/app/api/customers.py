"""Customer endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse

from app.firebase import database
from app.schemas.conversations import ConversationListResponse, ConversationResponse
from app.schemas.customers import (
    CustomerDetailResponse,
    CustomerListResponse,
    CustomerResponse,
)
from app.utils.auth import get_current_user, is_admin

router = APIRouter(prefix='/api/customers', tags=['customers'])
logger = logging.getLogger(__name__)


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={'success': False, 'message': message},
    )


# ---------------------------------------------------------------------------
# GET /api/customers — List customers (role-aware)
# ---------------------------------------------------------------------------
@router.get('', response_model=CustomerListResponse)
def list_customers(
    user_id: str = Query(..., description='Caller user ID'),
) -> CustomerListResponse | JSONResponse:
    caller = get_current_user(user_id)
    if not caller:
        return _error(status.HTTP_401_UNAUTHORIZED, 'User not found')

    all_customers = database.child('customers').get()
    if not isinstance(all_customers, dict):
        return CustomerListResponse(
            success=True, message='No customers found', customers=[], total=0,
        )

    # Admin sees every customer
    if is_admin(caller):
        customers = [
            CustomerResponse(**cust_data)
            for cust_data in all_customers.values()
            if isinstance(cust_data, dict)
        ]
    else:
        # Agent: only return customers who have at least one conversation
        # assigned to this agent.
        all_conversations = database.child('conversations').get()
        agent_customer_ids: set[str] = set()

        if isinstance(all_conversations, dict):
            for conv_data in all_conversations.values():
                if not isinstance(conv_data, dict):
                    continue
                if conv_data.get('assigned_agent') == user_id:
                    cid = conv_data.get('customer_id')
                    if cid:
                        agent_customer_ids.add(cid)

        customers = [
            CustomerResponse(**cust_data)
            for cust_id, cust_data in all_customers.items()
            if isinstance(cust_data, dict)
            and cust_data.get('customer_id', cust_id) in agent_customer_ids
        ]

    return CustomerListResponse(
        success=True,
        message=f'{len(customers)} customers found',
        customers=customers,
        total=len(customers),
    )


# ---------------------------------------------------------------------------
# GET /api/customers/{customer_id}
# ---------------------------------------------------------------------------
@router.get('/{customer_id}', response_model=CustomerDetailResponse)
def get_customer(customer_id: str) -> CustomerDetailResponse | JSONResponse:
    cust_data = database.child('customers').child(customer_id).get()

    if not isinstance(cust_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Customer not found')

    return CustomerDetailResponse(
        success=True,
        message='Customer found',
        customer=CustomerResponse(**cust_data),
    )


# ---------------------------------------------------------------------------
# GET /api/customers/{customer_id}/conversations
# ---------------------------------------------------------------------------
@router.get('/{customer_id}/conversations', response_model=ConversationListResponse)
def get_customer_conversations(
    customer_id: str,
    user_id: str = Query(..., description='Caller user ID'),
) -> ConversationListResponse | JSONResponse:
    caller = get_current_user(user_id)
    if not caller:
        return _error(status.HTTP_401_UNAUTHORIZED, 'User not found')

    # Verify customer exists
    cust_data = database.child('customers').child(customer_id).get()
    if not isinstance(cust_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Customer not found')

    all_conversations = database.child('conversations').get()
    if not isinstance(all_conversations, dict):
        return ConversationListResponse(
            success=True, message='No conversations found', conversations=[], total=0,
        )

    filtered: list[dict] = []
    for conv_id, conv_data in all_conversations.items():
        if not isinstance(conv_data, dict):
            continue

        # Must belong to this customer
        if conv_data.get('customer_id') != customer_id:
            continue

        # Role-based: agent can only see their own assigned conversations
        if not is_admin(caller) and conv_data.get('assigned_agent') != user_id:
            continue

        filtered.append(conv_data)

    filtered.sort(key=lambda c: c.get('last_message_at', ''), reverse=True)

    return ConversationListResponse(
        success=True,
        message=f'{len(filtered)} conversations found',
        conversations=[ConversationResponse(**c) for c in filtered],
        total=len(filtered),
    )
