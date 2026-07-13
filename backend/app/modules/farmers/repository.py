from datetime import date
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.animals.models import Animal, AnimalPhoto, SaleReadiness, Species
from app.modules.farmers.models import FarmerProfile
from app.modules.health.models import HealthRecord
from app.modules.marketplace.models import ListingStatus, MarketplaceListing
from app.modules.weights.models import WeightRecord


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


async def get_dashboard_animal_counts(
    session: AsyncSession,
    user_id: UUID,
) -> list[tuple[Species, int, int]]:
    result = await session.execute(
        select(
            Animal.species,
            func.count(Animal.id),
            func.sum(
                case(
                    (Animal.sale_readiness == SaleReadiness.READY, 1),
                    else_=0,
                )
            ),
        )
        .join(FarmerProfile, Animal.farmer_id == FarmerProfile.id)
        .where(
            FarmerProfile.user_id == user_id,
            Animal.deleted_at.is_(None),
        )
        .group_by(Animal.species)
    )
    return [
        (species, int(count), int(ready_count or 0))
        for species, count, ready_count in result.all()
    ]


async def count_active_marketplace_listings(
    session: AsyncSession,
    *,
    user_id: UUID,
    now,
) -> int:
    result = await session.execute(
        select(func.count(MarketplaceListing.id))
        .join(FarmerProfile, MarketplaceListing.farmer_id == FarmerProfile.id)
        .where(
            FarmerProfile.user_id == user_id,
            MarketplaceListing.status == ListingStatus.ACTIVE,
            MarketplaceListing.expires_at > now,
        )
    )
    return int(result.scalar_one())


async def count_due_health_alerts(
    session: AsyncSession,
    *,
    user_id: UUID,
    today: date,
) -> int:
    result = await session.execute(
        select(func.count(HealthRecord.id))
        .join(Animal, HealthRecord.animal_id == Animal.id)
        .join(FarmerProfile, Animal.farmer_id == FarmerProfile.id)
        .where(
            FarmerProfile.user_id == user_id,
            Animal.deleted_at.is_(None),
            HealthRecord.next_reminder_at.is_not(None),
            HealthRecord.next_reminder_at <= today,
        )
    )
    return int(result.scalar_one())


async def list_latest_weight_updates(
    session: AsyncSession,
    *,
    user_id: UUID,
    limit: int,
) -> list[tuple[WeightRecord, Animal]]:
    result = await session.execute(
        select(WeightRecord, Animal)
        .join(Animal, WeightRecord.animal_id == Animal.id)
        .join(FarmerProfile, Animal.farmer_id == FarmerProfile.id)
        .where(
            FarmerProfile.user_id == user_id,
            Animal.deleted_at.is_(None),
        )
        .order_by(
            WeightRecord.recorded_at.desc(),
            WeightRecord.created_at.desc(),
            WeightRecord.id.desc(),
        )
        .limit(limit)
    )
    return [(record, animal) for record, animal in result.all()]


async def list_recent_animals(
    session: AsyncSession,
    *,
    user_id: UUID,
    limit: int,
) -> list[Animal]:
    result = await session.execute(
        select(Animal)
        .join(FarmerProfile, Animal.farmer_id == FarmerProfile.id)
        .where(
            FarmerProfile.user_id == user_id,
            Animal.deleted_at.is_(None),
        )
        .order_by(Animal.created_at.desc(), Animal.id.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def list_recent_health_records(
    session: AsyncSession,
    *,
    user_id: UUID,
    limit: int,
) -> list[tuple[HealthRecord, Animal]]:
    result = await session.execute(
        select(HealthRecord, Animal)
        .join(Animal, HealthRecord.animal_id == Animal.id)
        .join(FarmerProfile, Animal.farmer_id == FarmerProfile.id)
        .where(
            FarmerProfile.user_id == user_id,
            Animal.deleted_at.is_(None),
        )
        .order_by(
            HealthRecord.recorded_at.desc(),
            HealthRecord.created_at.desc(),
            HealthRecord.id.desc(),
        )
        .limit(limit)
    )
    return [(record, animal) for record, animal in result.all()]


async def list_recent_photo_uploads(
    session: AsyncSession,
    *,
    user_id: UUID,
    limit: int,
) -> list[tuple[AnimalPhoto, Animal]]:
    result = await session.execute(
        select(AnimalPhoto, Animal)
        .join(Animal, AnimalPhoto.animal_id == Animal.id)
        .join(FarmerProfile, Animal.farmer_id == FarmerProfile.id)
        .where(
            FarmerProfile.user_id == user_id,
            Animal.deleted_at.is_(None),
        )
        .order_by(AnimalPhoto.uploaded_at.desc(), AnimalPhoto.id.desc())
        .limit(limit)
    )
    return [(photo, animal) for photo, animal in result.all()]
