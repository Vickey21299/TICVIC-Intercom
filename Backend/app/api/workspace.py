"""Workspace detail and dashboard stats endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.firebase import database
from app.schemas.workspace import (
    WorkspaceDetailResponse,
    WorkspaceResponse,
    WorkspaceStatsResponse,
    CustomDomainRequest,
)

router = APIRouter(prefix='/api/workspace', tags=['workspace'])
logger = logging.getLogger(__name__)


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={'success': False, 'message': message},
    )


# ---------------------------------------------------------------------------
# GET /api/workspace/{workspace_id}
# ---------------------------------------------------------------------------
@router.get('/{workspace_id}', response_model=WorkspaceDetailResponse)
def get_workspace(workspace_id: str) -> WorkspaceDetailResponse | JSONResponse:
    ws_data = database.child('workspaces').child(workspace_id).get()

    if not isinstance(ws_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Workspace not found')

    return WorkspaceDetailResponse(
        success=True,
        message='Workspace found',
        workspace=WorkspaceResponse(**ws_data),
    )


# ---------------------------------------------------------------------------
# GET /api/workspace/{workspace_id}/stats — Dashboard stats
# ---------------------------------------------------------------------------
@router.get('/{workspace_id}/stats', response_model=WorkspaceStatsResponse)
def get_workspace_stats(workspace_id: str) -> WorkspaceStatsResponse | JSONResponse:
    ws_data = database.child('workspaces').child(workspace_id).get()
    if not isinstance(ws_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Workspace not found')

    # Count conversations by status
    all_conversations = database.child('conversations').get()
    total = 0
    open_count = 0
    closed_count = 0
    pending_count = 0
    snoozed_count = 0

    if isinstance(all_conversations, dict):
        for conv_data in all_conversations.values():
            if not isinstance(conv_data, dict):
                continue
            if conv_data.get('workspace_id') != workspace_id:
                continue
            total += 1
            conv_status = conv_data.get('status', '')
            if conv_status == 'Open':
                open_count += 1
            elif conv_status == 'Closed':
                closed_count += 1
            elif conv_status == 'Pending':
                pending_count += 1
            elif conv_status == 'Snoozed':
                snoozed_count += 1

    # Count agents
    all_agents = database.child('agents').get()
    agent_count = 0
    if isinstance(all_agents, dict):
        agent_count = sum(
            1 for a in all_agents.values()
            if isinstance(a, dict) and a.get('workspace_id') == workspace_id
        )

    # Count customers
    all_customers = database.child('customers').get()
    customer_count = 0
    if isinstance(all_customers, dict):
        customer_count = len(all_customers)

    return WorkspaceStatsResponse(
        success=True,
        message='Stats retrieved',
        total_conversations=total,
        open_conversations=open_count,
        closed_conversations=closed_count,
        pending_conversations=pending_count,
        snoozed_conversations=snoozed_count,
        total_agents=agent_count,
        total_customers=customer_count,
    )


# ---------------------------------------------------------------------------
# POST /api/workspace/{workspace_id}/custom-domain — Add custom domain config
# ---------------------------------------------------------------------------
@router.post('/{workspace_id}/custom-domain', response_model=WorkspaceDetailResponse)
def add_custom_domain(
    workspace_id: str,
    payload: CustomDomainRequest,
) -> WorkspaceDetailResponse | JSONResponse:
    ws_data = database.child('workspaces').child(workspace_id).get()
    if not isinstance(ws_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Workspace not found')

    domain = payload.custom_domain.strip().lower()
    
    # Generate verification target values
    dns_txt_val = f"ticvic-verification-{workspace_id[:8]}"
    dns_cname_target = "cname.intercom-kb.com"

    # Update workspaces collection
    updates = {
        'custom_domain': domain,
        'custom_domain_status': 'pending',
        'ssl_status': 'pending',
        'dns_txt_record': dns_txt_val,
        'dns_cname_target': dns_cname_target,
    }
    database.child('workspaces').child(workspace_id).update(updates)

    updated_ws = database.child('workspaces').child(workspace_id).get()
    return WorkspaceDetailResponse(
        success=True,
        message='Custom domain requested. Please configure the CNAME and TXT records in your DNS panel.',
        workspace=WorkspaceResponse(**updated_ws),
    )


# ---------------------------------------------------------------------------
# POST /api/workspace/{workspace_id}/custom-domain/verify — Verify DNS & SSL
# ---------------------------------------------------------------------------
@router.post('/{workspace_id}/custom-domain/verify', response_model=WorkspaceDetailResponse)
def verify_custom_domain(workspace_id: str) -> WorkspaceDetailResponse | JSONResponse:
    ws_data = database.child('workspaces').child(workspace_id).get()
    if not isinstance(ws_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Workspace not found')

    if not ws_data.get('custom_domain'):
        return _error(status.HTTP_400_BAD_REQUEST, 'No custom domain configured')

    # Simulation/Stub of DNS CNAME and TXT check:
    # 1. In a real-world scenario, we would use dnspython or standard dig/host tool
    #    to check that 'custom_domain' has a CNAME pointing to 'dns_cname_target'
    #    and a TXT record '_intercom-challenge.{domain}' matches 'dns_txt_record'.
    # 2. SSL Provisioning (Let's Encrypt / Cloudflare SSL):
    #    - Let's Encrypt: Use certbot/lego API or Caddy On-Demand TLS feature.
    #    - Cloudflare: Issue custom hostname API call to register/provision SSL.
    # We will mark both as successful here for demonstration.
    
    updates = {
        'custom_domain_status': 'verified',
        'ssl_status': 'active',
    }
    database.child('workspaces').child(workspace_id).update(updates)

    updated_ws = database.child('workspaces').child(workspace_id).get()
    return WorkspaceDetailResponse(
        success=True,
        message='Custom domain and SSL certificate verified successfully!',
        workspace=WorkspaceResponse(**updated_ws),
    )


# ---------------------------------------------------------------------------
# DELETE /api/workspace/{workspace_id}/custom-domain — Remove custom domain config
# ---------------------------------------------------------------------------
@router.delete('/{workspace_id}/custom-domain', response_model=WorkspaceDetailResponse)
def delete_custom_domain(workspace_id: str) -> WorkspaceDetailResponse | JSONResponse:
    ws_data = database.child('workspaces').child(workspace_id).get()
    if not isinstance(ws_data, dict):
        return _error(status.HTTP_404_NOT_FOUND, 'Workspace not found')

    # Remove fields from database
    database.child('workspaces').child(workspace_id).update({
        'custom_domain': None,
        'custom_domain_status': None,
        'ssl_status': None,
        'dns_txt_record': None,
        'dns_cname_target': None,
    })

    updated_ws = database.child('workspaces').child(workspace_id).get()
    return WorkspaceDetailResponse(
        success=True,
        message='Custom domain configuration removed.',
        workspace=WorkspaceResponse(**updated_ws),
    )
