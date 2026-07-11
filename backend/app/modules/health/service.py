from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.animals.service import get_owned_animal
from app.modules.health import repository
from app.modules.health.models import HealthRecord
from app.modules.health.schemas import HealthRecordCreate
from app.modules.users.models import User


async def list_health_records(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
) -> list[HealthRecord]:
    animal = await get_owned_animal(session, current_user, animal_id)
    return await repository.list_records(session, animal.id)


async def create_health_record(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
    payload: HealthRecordCreate,
) -> HealthRecord:
    animal = await get_owned_animal(session, current_user, animal_id)
    record = await repository.create_record(session, animal_id=animal.id, payload=payload)
    await session.commit()
    await session.refresh(record)
    return record
