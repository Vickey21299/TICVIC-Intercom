"""Agent endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.firebase import database
from app.schemas.agents import (
    AgentDetailResponse,
    AgentListResponse,
    AgentResponse,
    AgentStatusUpdate,
)

router = APIRouter(prefix='/api/agents', tags=['agents'])
logger = logging.getLogger(__name__)


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={'success': False, 'message': message},
    )


# ---------------------------------------------------------------------------
# GET /api/agents — List all agents
# ---------------------------------------------------------------------------
@router.get('', response_model=AgentListResponse)
def list_agents() -> AgentListResponse:
    all_agents = database.child('agents').get()

    if not isinstance(all_agents, dict):
        return AgentListResponse(
            success=True, message='No agents found', agents=[], total=0,
        )

    agents = [
        AgentResponse(**agent_data)
        for agent_data in all_agents.values()
        if isinstance(agent_data, dict)
    ]

    return AgentListResponse(
        success=True,
        message=f'{len(agents)} agents found',
        agents=agents,
        total=len(agents),
    )


# ---------------------------------------------------------------------------
# GET /api/agents/{agent_id}
# ---------------------------------------------------------------------------
@router.get('/{agent_id}', response_model=AgentDetailResponse)
def get_agent(agent_id: str) -> AgentDetailResponse | JSONResponse:
    agent_data = database.child('agents').child(agent_id).get()

    if not isinstance(agent_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Agent not found')

    return AgentDetailResponse(
        success=True,
        message='Agent found',
        agent=AgentResponse(**agent_data),
    )


# ---------------------------------------------------------------------------
# PUT /api/agents/{agent_id}/status — Toggle online/offline
# ---------------------------------------------------------------------------
@router.put('/{agent_id}/status', response_model=AgentDetailResponse)
def update_agent_status(
    agent_id: str,
    payload: AgentStatusUpdate,
) -> AgentDetailResponse | JSONResponse:
    agent_data = database.child('agents').child(agent_id).get()

    if not isinstance(agent_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Agent not found')

    # Update in both agents and users nodes
    database.child('agents').child(agent_id).update({'online': payload.online})
    database.child('users').child(agent_id).update({'online': payload.online})

    updated = database.child('agents').child(agent_id).get()

    return AgentDetailResponse(
        success=True,
        message=f'Agent is now {"online" if payload.online else "offline"}',
        agent=AgentResponse(**updated),
    )
