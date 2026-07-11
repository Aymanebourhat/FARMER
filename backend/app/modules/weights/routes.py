from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.weights import service
from app.modules.weights.schemas import WeightRecordCreate, WeightRecordRead


router = APIRouter(prefix="/animals", tags=["weights"])


@router.get("/{animal_id}/weights", response_model=list[WeightRecordRead])
async def list_weight_records(
    animal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[WeightRecordRead]:
    return [
        WeightRecordRead.model_validate(record)
        for record in await service.list_weight_records(session, current_user, animal_id)
    ]


@router.post(
    "/{animal_id}/weights",
    response_model=WeightRecordRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_weight_record(
    animal_id: UUID,
    payload: WeightRecordCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> WeightRecordRead:
    return WeightRecordRead.model_validate(
        await service.create_weight_record(session, current_user, animal_id, payload)
    )
