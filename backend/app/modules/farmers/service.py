from datetime import UTC, date, datetime, time
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import ensure_user_owns_profile, require_farmer
from app.core.regions import is_valid_region, is_valid_region_province
from app.modules.farmers import repository
from app.modules.farmers.models import FarmerProfile
from app.modules.animals.models import Animal, Species
from app.modules.farmers.schemas import (
    DashboardActivityItem,
    DashboardLatestWeight,
    FarmerDashboardRead,
    FarmerProfileUpsert,
)
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
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="region and province are required",
        )
    if not is_valid_region(region):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Unknown Morocco region",
        )
    if not is_valid_region_province(region, province):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
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


def _animal_label(animal: Animal) -> str:
    return animal.breed.strip() if animal.breed and animal.breed.strip() else animal.species.value


def _activity_sort_value(value: date | datetime) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
    return datetime.combine(value, time.min, tzinfo=UTC)


async def get_my_dashboard(
    session: AsyncSession,
    current_user: User,
) -> FarmerDashboardRead:
    require_farmer(current_user)

    count_rows = await repository.get_dashboard_animal_counts(session, current_user.id)
    animals_by_species = {species.value: 0 for species in Species}
    total_animals = 0
    ready_for_sale = 0
    for species, count, ready_count in count_rows:
        animals_by_species[species.value] = count
        total_animals += count
        ready_for_sale += ready_count

    today = date.today()
    health_alerts = await repository.count_due_health_alerts(
        session,
        user_id=current_user.id,
        today=today,
    )
    active_listings = await repository.count_active_marketplace_listings(
        session,
        user_id=current_user.id,
        now=datetime.now(UTC),
    )
    latest_weight_rows = await repository.list_latest_weight_updates(
        session,
        user_id=current_user.id,
        limit=5,
    )
    latest_weight_updates = [
        DashboardLatestWeight(
            animal_id=animal.id,
            animal_label=_animal_label(animal),
            weight_kg=record.weight_kg,
            recorded_at=record.recorded_at,
            note=record.note,
        )
        for record, animal in latest_weight_rows
    ]

    recent_animals = await repository.list_recent_animals(
        session,
        user_id=current_user.id,
        limit=10,
    )
    recent_health = await repository.list_recent_health_records(
        session,
        user_id=current_user.id,
        limit=10,
    )
    recent_photos = await repository.list_recent_photo_uploads(
        session,
        user_id=current_user.id,
        limit=10,
    )
    activity: list[DashboardActivityItem] = [
        DashboardActivityItem(
            type="animal_created",
            title=_animal_label(animal),
            date=animal.created_at,
            animal_id=animal.id,
        )
        for animal in recent_animals
    ]
    activity.extend(
        DashboardActivityItem(
            type="weight_recorded",
            title=f"{record.weight_kg} kg · {_animal_label(animal)}",
            date=record.recorded_at,
            animal_id=animal.id,
        )
        for record, animal in latest_weight_rows
    )
    activity.extend(
        DashboardActivityItem(
            type="health_recorded",
            title=record.title,
            date=record.recorded_at,
            animal_id=animal.id,
        )
        for record, animal in recent_health
    )
    activity.extend(
        DashboardActivityItem(
            type="photo_uploaded",
            title=_animal_label(animal),
            date=photo.uploaded_at,
            animal_id=animal.id,
        )
        for photo, animal in recent_photos
    )
    recent_activity = sorted(
        activity,
        key=lambda item: _activity_sort_value(item.date),
        reverse=True,
    )[:10]

    return FarmerDashboardRead(
        total_animals=total_animals,
        animals_by_species=animals_by_species,
        active_listings=active_listings,
        ready_for_sale=ready_for_sale,
        health_alerts=health_alerts,
        latest_weight_updates=latest_weight_updates,
        recent_activity=recent_activity,
    )
