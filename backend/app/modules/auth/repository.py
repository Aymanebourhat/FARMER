from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import Language, User, UserRole, UserStatus
from app.modules.users.repository import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_phone,
)


async def find_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    return await get_user_by_id(session, user_id)


async def find_user_by_phone(session: AsyncSession, phone: str) -> User | None:
    return await get_user_by_phone(session, phone)


async def find_user_by_email(session: AsyncSession, email: str) -> User | None:
    return await get_user_by_email(session, email)


async def insert_user(
    session: AsyncSession,
    *,
    full_name: str,
    phone: str,
    password_hash: str,
    role: UserRole,
    preferred_language: Language,
    email: str | None = None,
    status: UserStatus = UserStatus.ACTIVE,
) -> User:
    return await create_user(
        session,
        full_name=full_name,
        phone=phone,
        email=email,
        password_hash=password_hash,
        role=role,
        preferred_language=preferred_language,
        status=status,
    )
