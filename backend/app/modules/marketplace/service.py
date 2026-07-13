from datetime import UTC, datetime, timedelta
from math import ceil
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import not_found, validation_error
from app.core.permissions import require_farmer
from app.core.regions import is_valid_region, is_valid_region_province
from app.modules.animals.models import AnimalOwnershipStatus
from app.modules.farmers.repository import get_profile_by_user_id
from app.modules.marketplace import repository
from app.modules.marketplace.models import ListingStatus, MarketplaceListing
from app.modules.marketplace.schemas import (
    ListingCreate,
    ListingOwnerResponse,
    ListingUpdate,
    MarketplaceFilters,
    OwnerListingFilters,
    PaginatedMarketplaceResponse,
    PaginatedOwnerListingsResponse,
    PublicAnimal,
    PublicListingDetail,
    PublicListingSummary,
    PublicPhoto,
    ReportCreate,
    ReportResponse,
)
from app.modules.users.models import User


LISTING_DURATION = timedelta(days=30)


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def calculate_trust_score(*, phone_verified: bool, photo_count: int, has_weight: bool, has_health: bool, profile_completion_score: int, report_count: int) -> int:
    score = 0
    score += 20 if phone_verified else 0
    score += 20 if photo_count >= 1 else 0
    score += 10 if photo_count >= 3 else 0
    score += 15 if has_weight else 0
    score += 15 if has_health else 0
    score += 10 if profile_completion_score == 100 else 0
    score += 10 if report_count == 0 else 0
    return min(score, 100)


def _score_row(row) -> int:
    return calculate_trust_score(
        phone_verified=bool(row.phone_verified),
        photo_count=int(row.photo_count),
        has_weight=int(row.weight_count) > 0,
        has_health=int(row.health_count) > 0,
        profile_completion_score=int(row.FarmerProfile.profile_completion_score),
        report_count=int(row.report_count),
    )


def _public_schema(row, detail: bool = False):
    listing = row.MarketplaceListing
    animal = row.Animal
    photos = [PublicPhoto(id=p.id, file_url=p.file_url, is_primary=p.is_primary) for p in animal.photos]
    primary = next((p.file_url for p in animal.photos if p.is_primary), photos[0].file_url if photos else None)
    values = dict(
        id=listing.id,
        title=listing.title,
        description=listing.description,
        price_mad=listing.price_mad,
        region=listing.region,
        province=listing.province,
        contact_phone=listing.contact_phone,
        contact_whatsapp=listing.contact_whatsapp,
        status=listing.status,
        trust_score=_score_row(row),
        expires_at=listing.expires_at,
        created_at=listing.created_at,
        animal=PublicAnimal(
            id=animal.id,
            species=animal.species,
            breed=animal.breed,
            sex=animal.sex,
            birth_date=animal.birth_date,
            estimated_age_months=animal.estimated_age_months,
            sale_readiness=animal.sale_readiness,
            latest_weight_kg=row.latest_weight,
            primary_photo_url=primary,
            photos=photos,
        ),
    )
    return (PublicListingDetail if detail else PublicListingSummary)(**values)


async def _owner_schema(session: AsyncSession, listing: MarketplaceListing) -> ListingOwnerResponse:
    row = await repository.get_projection(session, listing.id)
    if row is None:
        raise not_found("Listing not found")
    public = _public_schema(row, detail=True)
    return ListingOwnerResponse(**public.model_dump(), farmer_id=listing.farmer_id, animal_id=listing.animal_id, updated_at=listing.updated_at)


def _validate_filters(filters: MarketplaceFilters) -> None:
    if filters.min_price is not None and filters.max_price is not None and filters.min_price > filters.max_price:
        raise validation_error("min_price cannot exceed max_price")
    if filters.min_weight is not None and filters.max_weight is not None and filters.min_weight > filters.max_weight:
        raise validation_error("min_weight cannot exceed max_weight")
    if filters.region is not None and not is_valid_region(filters.region):
        raise validation_error("Unknown Morocco region")
    if filters.province is not None:
        if filters.region is None:
            if not any(filters.province in provinces for provinces in __import__("app.core.regions", fromlist=["MOROCCO_REGIONS"]).MOROCCO_REGIONS.values()):
                raise validation_error("Unknown Morocco province")
        elif not is_valid_region_province(filters.region, filters.province):
            raise validation_error("Province does not belong to selected region")


async def list_public(session: AsyncSession, filters: MarketplaceFilters) -> PaginatedMarketplaceResponse:
    _validate_filters(filters)
    rows, total = await repository.list_public(session, filters, datetime.now(UTC))
    items = [_public_schema(row) for row in rows]
    return PaginatedMarketplaceResponse(items=items, page=filters.page, page_size=filters.page_size, total=total, pages=ceil(total / filters.page_size) if total else 0)


async def get_public(session: AsyncSession, listing_id: UUID) -> PublicListingDetail:
    row = await repository.get_public(session, listing_id, datetime.now(UTC))
    if row is None:
        raise not_found("Listing not found")
    return _public_schema(row, detail=True)


async def create_listing(session: AsyncSession, current_user: User, payload: ListingCreate) -> ListingOwnerResponse:
    require_farmer(current_user)
    profile = await get_profile_by_user_id(session, current_user.id)
    if profile is None:
        raise validation_error("Farmer profile is required before creating a listing")
    if not is_valid_region_province(profile.region, profile.province):
        raise validation_error("Farmer profile has an invalid region and province")
    animal = await repository.get_animal_for_farmer(session, payload.animal_id, profile.id)
    if animal is None or animal.deleted_at is not None:
        raise not_found("Animal not found")
    if animal.ownership_status in {AnimalOwnershipStatus.SOLD, AnimalOwnershipStatus.DEAD}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal cannot be listed")
    if await repository.count_photos(session, animal.id) == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal requires at least one photo")
    now = datetime.now(UTC)
    await repository.expire_stale_for_animal(session, animal.id, now)
    if await repository.has_active_listing(session, animal.id, now):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal already has an active listing")
    try:
        listing = await repository.create_listing(session, animal_id=animal.id, farmer_id=profile.id, region=profile.region, province=profile.province, status=ListingStatus.ACTIVE, trust_score=0, expires_at=now + LISTING_DURATION, **payload.model_dump(exclude={"animal_id"}))
        animal.ownership_status = AnimalOwnershipStatus.LISTED
        await session.flush()
        await session.commit()
        await session.refresh(listing)
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal already has an active listing") from exc
    response = await _owner_schema(session, listing)
    listing.trust_score = response.trust_score
    await session.commit()
    return response


async def _owned(session: AsyncSession, current_user: User, listing_id: UUID) -> MarketplaceListing:
    require_farmer(current_user)
    listing = await repository.get_owned(session, listing_id, current_user.id)
    if listing is None:
        raise not_found("Listing not found")
    return listing


async def list_owned(session: AsyncSession, current_user: User, filters: OwnerListingFilters) -> PaginatedOwnerListingsResponse:
    require_farmer(current_user)
    listings, total = await repository.list_owned(session, current_user.id, filters)
    return PaginatedOwnerListingsResponse(
        items=[await _owner_schema(session, listing) for listing in listings],
        page=filters.page,
        page_size=filters.page_size,
        total=total,
        pages=ceil(total / filters.page_size) if total else 0,
    )


async def get_owned_detail(session: AsyncSession, current_user: User, listing_id: UUID) -> ListingOwnerResponse:
    return await _owner_schema(session, await _owned(session, current_user, listing_id))


async def update_listing(session: AsyncSession, current_user: User, listing_id: UUID, payload: ListingUpdate) -> ListingOwnerResponse:
    listing = await _owned(session, current_user, listing_id)
    if listing.status != ListingStatus.ACTIVE or _utc(listing.expires_at) <= datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Listing is not editable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(listing, field, value)
    await session.commit()
    await session.refresh(listing)
    return await _owner_schema(session, listing)


async def mark_sold(session: AsyncSession, current_user: User, listing_id: UUID) -> ListingOwnerResponse:
    listing = await _owned(session, current_user, listing_id)
    if listing.status == ListingStatus.SOLD:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Listing is already sold")
    if listing.status == ListingStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Suspended listing cannot be sold")
    animal = await repository.get_animal_for_farmer(session, listing.animal_id, listing.farmer_id)
    if animal is None:
        raise not_found("Animal not found")
    listing.status = ListingStatus.SOLD
    animal.ownership_status = AnimalOwnershipStatus.SOLD
    await session.commit()
    await session.refresh(listing)
    return await _owner_schema(session, listing)


async def renew(session: AsyncSession, current_user: User, listing_id: UUID) -> ListingOwnerResponse:
    listing = await _owned(session, current_user, listing_id)
    now = datetime.now(UTC)
    if listing.status != ListingStatus.EXPIRED and not (listing.status == ListingStatus.ACTIVE and _utc(listing.expires_at) <= now):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only expired listings can be renewed")
    animal = await repository.get_animal_for_farmer(session, listing.animal_id, listing.farmer_id)
    if animal is None or animal.deleted_at is not None:
        raise not_found("Animal not found")
    if animal.ownership_status in {AnimalOwnershipStatus.SOLD, AnimalOwnershipStatus.DEAD}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal cannot be renewed")
    if await repository.count_photos(session, animal.id) == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal requires at least one photo")
    if await repository.has_active_listing(session, animal.id, now, exclude_id=listing.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal already has an active listing")
    listing.status = ListingStatus.ACTIVE
    listing.expires_at = now + LISTING_DURATION
    animal.ownership_status = AnimalOwnershipStatus.LISTED
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Animal already has an active listing") from exc
    await session.refresh(listing)
    return await _owner_schema(session, listing)


async def report_listing(session: AsyncSession, listing_id: UUID, payload: ReportCreate, current_user: User | None) -> ReportResponse:
    if await repository.get_public(session, listing_id, datetime.now(UTC)) is None:
        raise not_found("Listing not found")
    if current_user is not None:
        duplicate = await repository.find_duplicate_report(session, listing_id, current_user.id, payload.reason, payload.description)
        if duplicate is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate pending report")
    report = await repository.create_report(session, listing_id=listing_id, reporter_user_id=current_user.id if current_user else None, **payload.model_dump())
    await session.commit()
    await session.refresh(report)
    projection = await repository.get_projection(session, listing_id)
    if projection is not None:
        projection.MarketplaceListing.trust_score = _score_row(projection)
        await session.commit()
    return ReportResponse.model_validate(report)
