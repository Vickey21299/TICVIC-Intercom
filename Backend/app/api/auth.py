import logging

import requests
from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse

from app.config.settings import FIREBASE_WEB_API_KEY
from app.firebase import database, firebase_auth
from app.schemas.auth import AuthResponse, LoginRequest, UserResponse

router = APIRouter(prefix='/api/auth', tags=['auth'])
logger = logging.getLogger(__name__)


def _normalize_user(document_id: str, payload: dict) -> UserResponse:
    return UserResponse(
        id=payload.get('user_id', document_id),
        name=payload['name'],
        email=payload['email'],
        role=payload['role'],
        workspace_id=payload['workspace_id'],
    )


def _find_user_by_email(email: str) -> tuple[str, dict] | None:
    users = database.child('users').get()

    if isinstance(users, dict):
        normalized_email = email.strip().lower()

        for user_id, user_data in users.items():
            if isinstance(user_data, dict) and user_data.get('email', '').lower() == normalized_email:
                return user_id, user_data

    return None


def _build_user_from_sources(
    user_id: str,
    auth_user: object | None,
    profile: dict | None,
) -> UserResponse:
    auth_claims = getattr(auth_user, 'custom_claims', None) or {}
    auth_email = getattr(auth_user, 'email', None)
    auth_name = getattr(auth_user, 'display_name', None)

    resolved_profile = profile or {}

    return UserResponse(
        id=resolved_profile.get('user_id', user_id),
        name=resolved_profile.get('name') or auth_name or 'Unknown User',
        email=resolved_profile.get('email') or auth_email or '',
        role=resolved_profile.get('role') or auth_claims.get('role', 'user'),
        workspace_id=resolved_profile.get('workspace_id')
        or auth_claims.get('workspace_id', ''),
    )


def _sign_in_with_firebase(email: str, password: str) -> dict | JSONResponse | None:
    if not FIREBASE_WEB_API_KEY:
        logger.error('Firebase Web API key is missing from environment')
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            'Firebase web API key is not configured',
        )

    logger.info('Login started for email=%s', email)

    request_url = (
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword'
        f'?key={FIREBASE_WEB_API_KEY}'
    )

    try:
        response = requests.post(
            request_url,
            json={
                'email': email,
                'password': password,
                'returnSecureToken': True,
            },
            timeout=10,
        )
    except requests.RequestException:
        logger.exception('Firebase Auth request failed for email=%s', email)
        return _error_response(
            status.HTTP_502_BAD_GATEWAY,
            'Unable to reach Firebase authentication service',
        )

    if response.status_code != status.HTTP_200_OK:
        logger.warning(
            'Firebase Auth rejected email=%s status=%s body=%s',
            email,
            response.status_code,
            response.text,
        )
        return None

    logger.info('Firebase Auth succeeded for email=%s', email)
    return response.json()


def _error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            'success': False,
            'message': message,
        },
    )


@router.post('/login', response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse | JSONResponse:
    firebase_result = _sign_in_with_firebase(payload.email, payload.password)
    if isinstance(firebase_result, JSONResponse):
        return firebase_result

    if not firebase_result:
        logger.warning('Login failed for email=%s due to invalid credentials', payload.email)
        return _error_response(status.HTTP_401_UNAUTHORIZED, 'Invalid email or password')

    user_id = firebase_result.get('localId')
    if not user_id:
        logger.error('Firebase Auth response missing localId for email=%s', payload.email)
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            'Firebase authentication response was incomplete',
        )

    logger.info('Fetching RTDB profile for user_id=%s', user_id)
    profile = database.child('users').child(user_id).get()

    auth_user = None
    try:
        auth_user = firebase_auth.get_user(user_id)
    except firebase_auth.UserNotFoundError:
        logger.warning('Firebase Auth user not found after successful login user_id=%s', user_id)
    except Exception:
        logger.exception('Unable to load Firebase Auth profile for user_id=%s', user_id)

    return AuthResponse(
        success=True,
        message='Login successful',
        user=_build_user_from_sources(user_id, auth_user, profile if isinstance(profile, dict) else None),
    )


@router.get('/me', response_model=AuthResponse)
def current_user(
    user_id: str | None = Query(default=None),
    email: str | None = Query(default=None),
) -> AuthResponse | JSONResponse:
    if not user_id and not email:
        return _error_response(status.HTTP_400_BAD_REQUEST, 'Provide user_id or email')

    if user_id:
        user_data = database.child('users').child(user_id).get()
        if user_data:
            return AuthResponse(
                success=True,
                message='User found',
                user=_normalize_user(user_id, user_data),
            )

    if email:
        matched_user = _find_user_by_email(email)
        if matched_user:
            document_id, user_data = matched_user
            return AuthResponse(
                success=True,
                message='User found',
                user=_normalize_user(document_id, user_data),
            )

    return _error_response(status.HTTP_404_NOT_FOUND, 'User not found')
