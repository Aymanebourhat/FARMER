from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.farmers.models import FarmerProfile


async def get_profile_by_user_id(session: AsyncSession, user_id: UUID) -> FarmerProfile | None:
    result = await session.execute(select(FarmerProfile).where(FarmerProfile.user_id == user_id))
    return result.scalar_one_or_none()


async def create_profile(
    session: AsyncSession,
    *,
    user_id: UUID,
    farm_name: str | None,
    region: str,
    province: str,
    commune: str | None,
    main_livestock_type: str | None,
    farm_size_label: str | None,
    profile_completion_score: int,
) -> FarmerProfile:
    profile = FarmerProfile(
        user_id=user_id,
        farm_name=farm_name,
        region=region,
        province=province,
        commune=commune,
        main_livestock_type=main_livestock_type,
        farm_size_label=farm_size_label,
        profile_completion_score=profile_completion_score,
    )
    session.add(profile)
    await session.flush()
    await session.refresh(profile)
    return profile
