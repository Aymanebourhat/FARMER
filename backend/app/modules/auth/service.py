from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.auth import repository
from app.modules.auth.schemas import AuthResponse, AuthUser, LoginRequest, RegisterRequest
from app.modules.users.models import User, UserRole, UserStatus


PUBLIC_REGISTRATION_ROLES = {UserRole.FARMER, UserRole.VET}


def _auth_response_for_user(user: User) -> AuthResponse:
    return AuthResponse(
        access_token=create_access_token(user.id),
        user=AuthUser.model_validate(user),
    )


async def register_user(session: AsyncSession, payload: RegisterRequest) -> AuthResponse:
    if payload.role not in PUBLIC_REGISTRATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Public registration accepts only farmer or vet roles",
        )

    existing = await repository.find_user_by_phone(session, payload.phone)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already registered")

    user = await repository.insert_user(
        session,
        full_name=payload.full_name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        preferred_language=payload.preferred_language,
    )
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists",
        ) from exc
    await session.refresh(user)
    return _auth_response_for_user(user)


async def authenticate_user(session: AsyncSession, payload: LoginRequest) -> AuthResponse:
    user = await repository.find_user_by_phone(session, payload.phone)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password",
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not active")

    return _auth_response_for_user(user)
