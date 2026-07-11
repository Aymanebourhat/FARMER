from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.animals.service import get_owned_animal
from app.modules.users.models import User
from app.modules.weights import repository
from app.modules.weights.models import WeightRecord
from app.modules.weights.schemas import WeightRecordCreate


async def list_weight_records(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
) -> list[WeightRecord]:
    animal = await get_owned_animal(session, current_user, animal_id)
    return await repository.list_records(session, animal.id)


async def create_weight_record(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
    payload: WeightRecordCreate,
) -> WeightRecord:
    animal = await get_owned_animal(session, current_user, animal_id)
    existing = await repository.get_for_date(
        session,
        animal_id=animal.id,
        recorded_at=payload.recorded_at,
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A weight record already exists for this animal and date",
        )
    try:
        record = await repository.create_record(session, animal_id=animal.id, payload=payload)
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A weight record already exists for this animal and date",
        ) from exc
    await session.refresh(record)
    return record
