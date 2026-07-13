from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.users.models import User, UserStatus
from app.modules.vets.models import VetProfile, VetVerificationStatus

async def get_by_user(session: AsyncSession, user_id: UUID) -> VetProfile | None:
    return (await session.execute(select(VetProfile).options(selectinload(VetProfile.user)).where(VetProfile.user_id == user_id))).scalar_one_or_none()

async def get_by_id(session: AsyncSession, vet_id: UUID) -> VetProfile | None:
    return (await session.execute(select(VetProfile).options(selectinload(VetProfile.user)).where(VetProfile.id == vet_id))).scalar_one_or_none()

async def list_public(session: AsyncSession, filters):
    query = select(VetProfile).join(User).options(selectinload(VetProfile.user)).where(VetProfile.verification_status == VetVerificationStatus.APPROVED, User.status == UserStatus.ACTIVE)
    if filters.region: query = query.where(VetProfile.region == filters.region)
    if filters.province: query = query.where(VetProfile.province == filters.province)
    if filters.specialization: query = query.where(VetProfile.specialization.ilike(f"%{filters.specialization}%"))
    total = int((await session.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one())
    order = (User.full_name.asc(), VetProfile.id.asc()) if filters.sort == "name" else (VetProfile.verified_at.desc(), VetProfile.id.desc())
    rows = (await session.execute(query.order_by(*order).offset((filters.page - 1) * filters.page_size).limit(filters.page_size))).scalars().all()
    return list(rows), total

async def get_public(session: AsyncSession, vet_id: UUID) -> VetProfile | None:
    return (await session.execute(select(VetProfile).join(User).options(selectinload(VetProfile.user)).where(VetProfile.id == vet_id, VetProfile.verification_status == VetVerificationStatus.APPROVED, User.status == UserStatus.ACTIVE))).scalar_one_or_none()

async def list_pending(session: AsyncSession, filters):
    query = select(VetProfile).join(User).options(selectinload(VetProfile.user)).where(VetProfile.verification_status == VetVerificationStatus.PENDING)
    if filters.region: query = query.where(VetProfile.region == filters.region)
    if filters.province: query = query.where(VetProfile.province == filters.province)
    total = int((await session.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one())
    order = (User.full_name.asc(), VetProfile.id.asc()) if filters.sort == "name" else (VetProfile.created_at.desc(), VetProfile.id.desc())
    rows = (await session.execute(query.order_by(*order).offset((filters.page - 1) * filters.page_size).limit(filters.page_size))).scalars().all()
    return list(rows), total

def create(session: AsyncSession, **values) -> VetProfile:
    profile = VetProfile(**values); session.add(profile); return profile
