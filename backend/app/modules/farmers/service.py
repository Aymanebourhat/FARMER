from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import ensure_user_owns_profile, require_farmer
from app.core.regions import is_valid_region, is_valid_region_province
from app.modules.farmers import repository
from app.modules.farmers.models import FarmerProfile
from app.modules.farmers.schemas import FarmerProfileUpsert
from app.modules.users.models import User


PROFILE_SCORE_WEIGHTS = {
    "region": 25,
    "province": 25,
    "farm_name": 20,
    "main_livestock_type": 15,
    "farm_size_label": 10,
    "commune": 5,
}


def calculate_profile_completion_score(values: dict[str, Any]) -> int:
    score = 0
    for field_name, points in PROFILE_SCORE_WEIGHTS.items():
        value = values.get(field_name)
        if isinstance(value, str) and value.strip():
            score += points
    return min(score, 100)


def _validate_location(region: str | None, province: str | None) -> None:
    if not region or not province:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="region and province are required",
        )
    if not is_valid_region(region):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unknown Morocco region",
        )
    if not is_valid_region_province(region, province):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Province does not belong to selected region",
        )


async def get_my_profile(session: AsyncSession, current_user: User) -> FarmerProfile:
    require_farmer(current_user)
    profile = await repository.get_profile_by_user_id(session, current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer profile not found")
    ensure_user_owns_profile(current_user, profile.user_id)
    return profile


async def upsert_my_profile(
    session: AsyncSession,
    current_user: User,
    payload: FarmerProfileUpsert,
) -> FarmerProfile:
    require_farmer(current_user)
    profile = await repository.get_profile_by_user_id(session, current_user.id)
    update_values = payload.model_dump(exclude_unset=True)

    merged_values = {
        "farm_name": profile.farm_name if profile else None,
        "region": profile.region if profile else None,
        "province": profile.province if profile else None,
        "commune": profile.commune if profile else None,
        "main_livestock_type": profile.main_livestock_type if profile else None,
        "farm_size_label": profile.farm_size_label if profile else None,
    }
    merged_values.update(update_values)
    _validate_location(merged_values["region"], merged_values["province"])
    merged_values["profile_completion_score"] = calculate_profile_completion_score(merged_values)

    if profile is None:
        profile = await repository.create_profile(
            session,
            user_id=current_user.id,
            farm_name=merged_values["farm_name"],
            region=merged_values["region"],
            province=merged_values["province"],
            commune=merged_values["commune"],
            main_livestock_type=merged_values["main_livestock_type"],
            farm_size_label=merged_values["farm_size_label"],
            profile_completion_score=merged_values["profile_completion_score"],
        )
    else:
        ensure_user_owns_profile(current_user, profile.user_id)
        for field_name, value in merged_values.items():
            setattr(profile, field_name, value)
        await session.flush()
        await session.refresh(profile)

    await session.commit()
    await session.refresh(profile)
    return profile
