from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.health.models import HealthRecord, HealthVerificationStatus
from app.modules.health.schemas import HealthRecordCreate


async def list_records(session: AsyncSession, animal_id: UUID) -> list[HealthRecord]:
    result = await session.execute(
        select(HealthRecord)
        .where(HealthRecord.animal_id == animal_id)
        .order_by(HealthRecord.recorded_at.asc(), HealthRecord.created_at.asc())
    )
    return list(result.scalars().all())


async def create_record(
    session: AsyncSession,
    *,
    animal_id: UUID,
    payload: HealthRecordCreate,
) -> HealthRecord:
    record = HealthRecord(
        animal_id=animal_id,
        verification_status=HealthVerificationStatus.FARMER_REPORTED,
        **payload.model_dump(),
    )
    session.add(record)
    await session.flush()
    return record
