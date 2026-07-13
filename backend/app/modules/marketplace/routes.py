from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user, get_optional_current_user
from app.modules.marketplace import service
from app.modules.marketplace.schemas import (
    ListingCreate,
    ListingOwnerResponse,
    ListingUpdate,
    MarketplaceFilters,
    OwnerListingFilters,
    PaginatedMarketplaceResponse,
    PaginatedOwnerListingsResponse,
    PublicListingDetail,
    ReportCreate,
    ReportResponse,
)
from app.modules.users.models import User


router = APIRouter(prefix="/marketplace", tags=["marketplace"])


@router.get("/my-listings", response_model=PaginatedOwnerListingsResponse)
async def read_my_listings(filters: OwnerListingFilters = Depends(), current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> PaginatedOwnerListingsResponse:
    return await service.list_owned(session, current_user, filters)


@router.get("/my-listings/{listing_id}", response_model=ListingOwnerResponse)
async def read_my_listing(listing_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> ListingOwnerResponse:
    return await service.get_owned_detail(session, current_user, listing_id)


@router.get("/listings", response_model=PaginatedMarketplaceResponse)
async def browse_listings(filters: MarketplaceFilters = Depends(), session: AsyncSession = Depends(get_session)) -> PaginatedMarketplaceResponse:
    return await service.list_public(session, filters)


@router.post("/listings", response_model=ListingOwnerResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(payload: ListingCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> ListingOwnerResponse:
    return await service.create_listing(session, current_user, payload)


@router.get("/listings/{listing_id}", response_model=PublicListingDetail)
async def read_listing(listing_id: UUID, session: AsyncSession = Depends(get_session)) -> PublicListingDetail:
    return await service.get_public(session, listing_id)


@router.patch("/listings/{listing_id}", response_model=ListingOwnerResponse)
async def update_listing(listing_id: UUID, payload: ListingUpdate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> ListingOwnerResponse:
    return await service.update_listing(session, current_user, listing_id, payload)


@router.post("/listings/{listing_id}/mark-sold", response_model=ListingOwnerResponse)
async def mark_listing_sold(listing_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> ListingOwnerResponse:
    return await service.mark_sold(session, current_user, listing_id)


@router.post("/listings/{listing_id}/renew", response_model=ListingOwnerResponse)
async def renew_listing(listing_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> ListingOwnerResponse:
    return await service.renew(session, current_user, listing_id)


@router.post("/listings/{listing_id}/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def report_listing(listing_id: UUID, payload: ReportCreate, current_user: User | None = Depends(get_optional_current_user), session: AsyncSession = Depends(get_session)) -> ReportResponse:
    return await service.report_listing(session, listing_id, payload, current_user)
