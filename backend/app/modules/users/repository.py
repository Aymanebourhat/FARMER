from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import Language, User, UserRole, UserStatus


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    return await session.get(User, user_id)


async def get_user_by_phone(session: AsyncSession, phone: str) -> User | None:
    result = await session.execute(select(User).where(User.phone == phone))
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(
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
    user = User(
        full_name=full_name,
        phone=phone,
        email=email,
        password_hash=password_hash,
        role=role,
        preferred_language=preferred_language,
        status=status,
        phone_verified=False,
    )
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user
