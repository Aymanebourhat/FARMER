from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import AuthResponse, AuthUser, LoginRequest, RegisterRequest
from app.modules.auth.service import authenticate_user, register_user
from app.modules.users.models import User


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> AuthResponse:
    return await register_user(session, payload)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> AuthResponse:
    return await authenticate_user(session, payload)


@router.get("/me", response_model=AuthUser)
async def me(current_user: User = Depends(get_current_user)) -> AuthUser:
    return AuthUser.model_validate(current_user)
