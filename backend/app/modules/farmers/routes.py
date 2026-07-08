from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user
from app.modules.farmers.schemas import FarmerProfileRead, FarmerProfileUpsert
from app.modules.farmers.service import get_my_profile, upsert_my_profile
from app.modules.users.models import User


router = APIRouter(prefix="/farmers", tags=["farmers"])


@router.get("/me", response_model=FarmerProfileRead)
async def read_my_farmer_profile(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FarmerProfileRead:
    return FarmerProfileRead.model_validate(await get_my_profile(session, current_user))


@router.patch("/me", response_model=FarmerProfileRead)
async def upsert_farmer_profile(
    payload: FarmerProfileUpsert,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FarmerProfileRead:
    return FarmerProfileRead.model_validate(await upsert_my_profile(session, current_user, payload))
