from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user
from app.modules.health import service
from app.modules.health.schemas import HealthRecordCreate, HealthRecordRead
from app.modules.users.models import User


router = APIRouter(prefix="/animals", tags=["health-records"])


@router.get("/{animal_id}/health-records", response_model=list[HealthRecordRead])
async def list_health_records(
    animal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[HealthRecordRead]:
    return [
        HealthRecordRead.model_validate(record)
        for record in await service.list_health_records(session, current_user, animal_id)
    ]


@router.post(
    "/{animal_id}/health-records",
    response_model=HealthRecordRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_health_record(
    animal_id: UUID,
    payload: HealthRecordCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> HealthRecordRead:
    return HealthRecordRead.model_validate(
        await service.create_health_record(session, current_user, animal_id, payload)
    )
