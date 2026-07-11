from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.animals.models import Animal, AnimalPhoto, VerificationLevel
from app.modules.animals.schemas import AnimalCreate
from app.modules.farmers.models import FarmerProfile


async def create_animal(
    session: AsyncSession,
    *,
    farmer_id: UUID,
    payload: AnimalCreate,
) -> Animal:
    animal = Animal(
        farmer_id=farmer_id,
        verification_level=VerificationLevel.SELF_REPORTED,
        **payload.model_dump(),
    )
    session.add(animal)
    await session.flush()
    return animal


async def list_owned_animals(session: AsyncSession, user_id: UUID) -> list[Animal]:
    result = await session.execute(
        select(Animal)
        .join(FarmerProfile, Animal.farmer_id == FarmerProfile.id)
        .where(FarmerProfile.user_id == user_id, Animal.deleted_at.is_(None))
        .order_by(Animal.created_at.desc())
    )
    return list(result.scalars().all())


async def get_owned_animal(
    session: AsyncSession,
    *,
    user_id: UUID,
    animal_id: UUID,
) -> Animal | None:
    result = await session.execute(
        select(Animal)
        .join(FarmerProfile, Animal.farmer_id == FarmerProfile.id)
        .where(
            Animal.id == animal_id,
            FarmerProfile.user_id == user_id,
            Animal.deleted_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def soft_delete_animal(session: AsyncSession, animal: Animal) -> None:
    animal.deleted_at = datetime.now(UTC)
    await session.flush()


async def count_photos(session: AsyncSession, animal_id: UUID) -> int:
    result = await session.execute(
        select(func.count(AnimalPhoto.id)).where(AnimalPhoto.animal_id == animal_id)
    )
    return int(result.scalar_one())


async def create_photo(
    session: AsyncSession,
    *,
    animal_id: UUID,
    file_url: str,
    file_key: str,
    mime_type: str,
    size_bytes: int,
    is_primary: bool,
) -> AnimalPhoto:
    photo = AnimalPhoto(
        animal_id=animal_id,
        file_url=file_url,
        file_key=file_key,
        mime_type=mime_type,
        size_bytes=size_bytes,
        is_primary=is_primary,
    )
    session.add(photo)
    await session.flush()
    return photo


async def list_photos(session: AsyncSession, animal_id: UUID) -> list[AnimalPhoto]:
    result = await session.execute(
        select(AnimalPhoto)
        .where(AnimalPhoto.animal_id == animal_id)
        .order_by(AnimalPhoto.uploaded_at.asc(), AnimalPhoto.id.asc())
    )
    return list(result.scalars().all())


async def get_photo(
    session: AsyncSession,
    *,
    animal_id: UUID,
    photo_id: UUID,
) -> AnimalPhoto | None:
    result = await session.execute(
        select(AnimalPhoto).where(
            AnimalPhoto.id == photo_id,
            AnimalPhoto.animal_id == animal_id,
        )
    )
    return result.scalar_one_or_none()


async def set_primary_photo(
    session: AsyncSession,
    *,
    animal_id: UUID,
    photo: AnimalPhoto,
) -> None:
    await session.execute(
        update(AnimalPhoto)
        .where(AnimalPhoto.animal_id == animal_id, AnimalPhoto.id != photo.id)
        .values(is_primary=False)
    )
    photo.is_primary = True
    await session.flush()


async def delete_photo(session: AsyncSession, photo: AnimalPhoto) -> None:
    await session.delete(photo)
    await session.flush()


async def get_oldest_photo(session: AsyncSession, animal_id: UUID) -> AnimalPhoto | None:
    result = await session.execute(
        select(AnimalPhoto)
        .where(AnimalPhoto.animal_id == animal_id)
        .order_by(AnimalPhoto.uploaded_at.asc(), AnimalPhoto.id.asc())
        .limit(1)
    )
    return result.scalar_one_or_none()
