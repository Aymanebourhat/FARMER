from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.weights.models import WeightRecord
from app.modules.weights.schemas import WeightRecordCreate


async def list_records(session: AsyncSession, animal_id: UUID) -> list[WeightRecord]:
    result = await session.execute(
        select(WeightRecord)
        .where(WeightRecord.animal_id == animal_id)
        .order_by(WeightRecord.recorded_at.asc(), WeightRecord.created_at.asc())
    )
    return list(result.scalars().all())


async def get_for_date(
    session: AsyncSession,
    *,
    animal_id: UUID,
    recorded_at: object,
) -> WeightRecord | None:
    result = await session.execute(
        select(WeightRecord).where(
            WeightRecord.animal_id == animal_id,
            WeightRecord.recorded_at == recorded_at,
        )
    )
    return result.scalar_one_or_none()


async def create_record(
    session: AsyncSession,
    *,
    animal_id: UUID,
    payload: WeightRecordCreate,
) -> WeightRecord:
    record = WeightRecord(animal_id=animal_id, **payload.model_dump())
    session.add(record)
    await session.flush()
    return record
