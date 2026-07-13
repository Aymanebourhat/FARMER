from datetime import datetime
from uuid import UUID

from sqlalchemy import Select, case, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.animals.models import Animal, AnimalPhoto
from app.modules.farmers.models import FarmerProfile
from app.modules.health.models import HealthRecord
from app.modules.marketplace.models import ListingReport, ListingStatus, MarketplaceListing, ReportStatus
from app.modules.marketplace.schemas import MarketplaceFilters
from app.modules.users.models import User, UserStatus
from app.modules.weights.models import WeightRecord


latest_weight_date = (
    select(func.max(WeightRecord.recorded_at))
    .where(WeightRecord.animal_id == Animal.id)
    .correlate(Animal)
    .scalar_subquery()
)
latest_weight = (
    select(WeightRecord.weight_kg)
    .where(WeightRecord.animal_id == Animal.id, WeightRecord.recorded_at == latest_weight_date)
    .order_by(WeightRecord.created_at.desc(), WeightRecord.id.desc())
    .limit(1)
    .correlate(Animal)
    .scalar_subquery()
)
photo_count = select(func.count(AnimalPhoto.id)).where(AnimalPhoto.animal_id == Animal.id).correlate(Animal).scalar_subquery()
weight_count = select(func.count(WeightRecord.id)).where(WeightRecord.animal_id == Animal.id).correlate(Animal).scalar_subquery()
health_count = select(func.count(HealthRecord.id)).where(HealthRecord.animal_id == Animal.id).correlate(Animal).scalar_subquery()
report_count = select(func.count(ListingReport.id)).where(ListingReport.listing_id == MarketplaceListing.id).correlate(MarketplaceListing).scalar_subquery()
trust_score_expression = (
    case((User.phone_verified.is_(True), 20), else_=0)
    + case((photo_count >= 1, 20), else_=0)
    + case((photo_count >= 3, 10), else_=0)
    + case((weight_count > 0, 15), else_=0)
    + case((health_count > 0, 15), else_=0)
    + case((FarmerProfile.profile_completion_score == 100, 10), else_=0)
    + case((report_count == 0, 10), else_=0)
)


def _public_base(now: datetime) -> Select:
    return (
        select(
            MarketplaceListing,
            Animal,
            FarmerProfile,
            User.phone_verified,
            latest_weight.label("latest_weight"),
            photo_count.label("photo_count"),
            weight_count.label("weight_count"),
            health_count.label("health_count"),
            report_count.label("report_count"),
        )
        .join(Animal, MarketplaceListing.animal_id == Animal.id)
        .join(FarmerProfile, MarketplaceListing.farmer_id == FarmerProfile.id)
        .join(User, FarmerProfile.user_id == User.id)
        .options(selectinload(MarketplaceListing.animal).selectinload(Animal.photos))
        .where(
            MarketplaceListing.status == ListingStatus.ACTIVE,
            MarketplaceListing.expires_at > now,
            Animal.deleted_at.is_(None),
            User.status == UserStatus.ACTIVE,
        )
    )


async def list_public(session: AsyncSession, filters: MarketplaceFilters, now: datetime) -> tuple[list[object], int]:
    query = _public_base(now)
    conditions = []
    for field, value in ((Animal.species, filters.species), (Animal.breed, filters.breed), (MarketplaceListing.region, filters.region), (MarketplaceListing.province, filters.province), (Animal.sex, filters.sex), (Animal.sale_readiness, filters.sale_readiness)):
        if value is not None:
            conditions.append(field == value)
    if filters.min_price is not None:
        conditions.append(MarketplaceListing.price_mad >= filters.min_price)
    if filters.max_price is not None:
        conditions.append(MarketplaceListing.price_mad <= filters.max_price)
    if filters.min_weight is not None:
        conditions.append(latest_weight >= filters.min_weight)
    if filters.max_weight is not None:
        conditions.append(latest_weight <= filters.max_weight)
    query = query.where(*conditions)

    count_query = select(func.count()).select_from(query.order_by(None).subquery())
    total = int((await session.execute(count_query)).scalar_one())
    order = {
        "price_low_to_high": (MarketplaceListing.price_mad.asc(), MarketplaceListing.id.asc()),
        "price_high_to_low": (MarketplaceListing.price_mad.desc(), MarketplaceListing.id.desc()),
        "highest_trust": (trust_score_expression.desc(), MarketplaceListing.created_at.desc()),
    }.get(filters.sort, (MarketplaceListing.created_at.desc(), MarketplaceListing.id.desc()))
    query = query.order_by(*order).offset((filters.page - 1) * filters.page_size).limit(filters.page_size)
    return list((await session.execute(query)).all()), total


async def get_public(session: AsyncSession, listing_id: UUID, now: datetime):
    return (await session.execute(_public_base(now).where(MarketplaceListing.id == listing_id))).one_or_none()


async def get_projection(session: AsyncSession, listing_id: UUID):
    query = (
        select(MarketplaceListing, Animal, FarmerProfile, User.phone_verified, latest_weight.label("latest_weight"), photo_count.label("photo_count"), weight_count.label("weight_count"), health_count.label("health_count"), report_count.label("report_count"))
        .join(Animal, MarketplaceListing.animal_id == Animal.id)
        .join(FarmerProfile, MarketplaceListing.farmer_id == FarmerProfile.id)
        .join(User, FarmerProfile.user_id == User.id)
        .options(selectinload(MarketplaceListing.animal).selectinload(Animal.photos))
        .where(MarketplaceListing.id == listing_id)
    )
    return (await session.execute(query)).one_or_none()


async def get_owned(session: AsyncSession, listing_id: UUID, user_id: UUID) -> MarketplaceListing | None:
    result = await session.execute(
        select(MarketplaceListing)
        .join(FarmerProfile, MarketplaceListing.farmer_id == FarmerProfile.id)
        .where(MarketplaceListing.id == listing_id, FarmerProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def list_owned(session: AsyncSession, user_id: UUID, filters) -> tuple[list[MarketplaceListing], int]:
    query = (
        select(MarketplaceListing)
        .join(FarmerProfile, MarketplaceListing.farmer_id == FarmerProfile.id)
        .where(FarmerProfile.user_id == user_id)
    )
    if filters.status is not None:
        query = query.where(MarketplaceListing.status == filters.status)
    total = int((await session.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one())
    rows = (
        await session.execute(
            query.order_by(MarketplaceListing.created_at.desc(), MarketplaceListing.id.desc())
            .offset((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
        )
    ).scalars().all()
    return list(rows), total


async def get_animal_for_farmer(session: AsyncSession, animal_id: UUID, farmer_id: UUID) -> Animal | None:
    return (await session.execute(select(Animal).where(Animal.id == animal_id, Animal.farmer_id == farmer_id))).scalar_one_or_none()


async def has_active_listing(session: AsyncSession, animal_id: UUID, now: datetime, exclude_id: UUID | None = None) -> bool:
    query = select(exists().where(MarketplaceListing.animal_id == animal_id, MarketplaceListing.status == ListingStatus.ACTIVE, MarketplaceListing.expires_at > now))
    if exclude_id is not None:
        query = select(exists().where(MarketplaceListing.animal_id == animal_id, MarketplaceListing.status == ListingStatus.ACTIVE, MarketplaceListing.expires_at > now, MarketplaceListing.id != exclude_id))
    return bool((await session.execute(query)).scalar_one())


async def expire_stale_for_animal(session: AsyncSession, animal_id: UUID, now: datetime) -> None:
    rows = (await session.execute(select(MarketplaceListing).where(MarketplaceListing.animal_id == animal_id, MarketplaceListing.status == ListingStatus.ACTIVE, MarketplaceListing.expires_at <= now))).scalars().all()
    for listing in rows:
        listing.status = ListingStatus.EXPIRED
    await session.flush()


async def create_listing(session: AsyncSession, **values) -> MarketplaceListing:
    listing = MarketplaceListing(**values)
    session.add(listing)
    await session.flush()
    return listing


async def count_photos(session: AsyncSession, animal_id: UUID) -> int:
    return int((await session.execute(select(func.count(AnimalPhoto.id)).where(AnimalPhoto.animal_id == animal_id))).scalar_one())


async def trust_evidence(session: AsyncSession, listing: MarketplaceListing) -> tuple[bool, int, int, int, int, int]:
    row = (await session.execute(
        select(User.phone_verified, FarmerProfile.profile_completion_score, photo_count, weight_count, health_count, report_count)
        .select_from(MarketplaceListing)
        .join(Animal, MarketplaceListing.animal_id == Animal.id)
        .join(FarmerProfile, MarketplaceListing.farmer_id == FarmerProfile.id)
        .join(User, FarmerProfile.user_id == User.id)
        .where(MarketplaceListing.id == listing.id)
    )).one()
    return tuple(row)


async def find_duplicate_report(session: AsyncSession, listing_id: UUID, user_id: UUID, reason, description: str | None) -> ListingReport | None:
    return (await session.execute(select(ListingReport).where(ListingReport.listing_id == listing_id, ListingReport.reporter_user_id == user_id, ListingReport.reason == reason, ListingReport.description == description, ListingReport.status == ReportStatus.PENDING))).scalar_one_or_none()


async def create_report(session: AsyncSession, **values) -> ListingReport:
    report = ListingReport(**values)
    session.add(report)
    await session.flush()
    return report


async def count_active_for_user(session: AsyncSession, user_id: UUID, now: datetime) -> int:
    return int((await session.execute(select(func.count(MarketplaceListing.id)).join(FarmerProfile, MarketplaceListing.farmer_id == FarmerProfile.id).where(FarmerProfile.user_id == user_id, MarketplaceListing.status == ListingStatus.ACTIVE, MarketplaceListing.expires_at > now))).scalar_one())
