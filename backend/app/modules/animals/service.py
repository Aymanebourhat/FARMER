import asyncio
from datetime import UTC, date, datetime, time
from uuid import UUID

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import not_found, validation_error
from app.core.permissions import require_farmer
from app.modules.animals import repository
from app.modules.animals.models import Animal, AnimalPhoto
from app.modules.animals.schemas import (
    AnimalCreate,
    AnimalHistoryEvent,
    AnimalUpdate,
)
from app.modules.farmers.repository import get_profile_by_user_id
from app.modules.health import repository as health_repository
from app.modules.media.image_optimizer import optimize_animal_photo
from app.modules.media.service import delete_local_file, save_animal_photo
from app.modules.users.models import User
from app.modules.weights import repository as weight_repository


MAX_PHOTOS_PER_ANIMAL = 5
ALLOWED_PHOTO_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def get_owned_animal(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
) -> Animal:
    require_farmer(current_user)
    animal = await repository.get_owned_animal(
        session,
        user_id=current_user.id,
        animal_id=animal_id,
    )
    if animal is None:
        raise not_found("Animal not found")
    return animal


async def create_animal(
    session: AsyncSession,
    current_user: User,
    payload: AnimalCreate,
) -> Animal:
    require_farmer(current_user)
    profile = await get_profile_by_user_id(session, current_user.id)
    if profile is None:
        raise validation_error("Farmer profile is required before creating animals")

    animal = await repository.create_animal(session, farmer_id=profile.id, payload=payload)
    await session.commit()
    await session.refresh(animal)
    return animal


async def list_animals(session: AsyncSession, current_user: User) -> list[Animal]:
    require_farmer(current_user)
    return await repository.list_owned_animals(session, current_user.id)


async def read_animal(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
) -> Animal:
    return await get_owned_animal(session, current_user, animal_id)


async def update_animal(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
    payload: AnimalUpdate,
) -> Animal:
    animal = await get_owned_animal(session, current_user, animal_id)
    values = payload.model_dump(exclude_unset=True)
    required_fields = {"species", "sex", "health_status", "ownership_status", "sale_readiness"}
    if any(values.get(field_name) is None for field_name in required_fields & values.keys()):
        raise validation_error("Required animal fields cannot be null")

    birth_date = values.get("birth_date", animal.birth_date)
    estimated_age_months = values.get("estimated_age_months", animal.estimated_age_months)
    if birth_date is None and estimated_age_months is None:
        raise validation_error("Either birth_date or estimated_age_months must be provided")

    for field_name, value in values.items():
        setattr(animal, field_name, value)
    await session.commit()
    await session.refresh(animal)
    return animal


async def delete_animal(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
) -> None:
    animal = await get_owned_animal(session, current_user, animal_id)
    await repository.soft_delete_animal(session, animal)
    await session.commit()


def _content_matches_mime(mime_type: str, content: bytes) -> bool:
    if mime_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if mime_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if mime_type == "image/webp":
        return len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    return False


async def upload_photo(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
    file: UploadFile,
) -> AnimalPhoto:
    animal = await get_owned_animal(session, current_user, animal_id)
    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_PHOTO_MIME_TYPES:
        raise validation_error("Only JPEG, PNG, and WebP images are accepted")
    photo_count = await repository.count_photos(session, animal.id)
    if photo_count >= MAX_PHOTOS_PER_ANIMAL:
        raise validation_error("An animal can have at most 5 photos")

    settings = get_settings()
    try:
        content = await file.read(settings.max_animal_photo_upload_bytes + 1)
    finally:
        await file.close()
    if not content:
        raise validation_error("Photo cannot be empty")
    if len(content) > settings.max_animal_photo_upload_bytes:
        raise validation_error("Photo cannot exceed 10 MB")
    if not _content_matches_mime(mime_type, content):
        raise validation_error("File content does not match the declared image type")

    try:
        optimized_content, optimized_size, output_mime_type, output_extension = (
            await asyncio.to_thread(
                optimize_animal_photo,
                content,
                max_dimension=settings.animal_photo_max_dimension,
                quality=settings.animal_photo_jpeg_quality,
            )
        )
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise validation_error("Invalid or unsupported image file") from exc

    file_key, file_url = await save_animal_photo(
        animal_id=animal.id,
        content=optimized_content,
        extension=output_extension,
    )
    try:
        photo = await repository.create_photo(
            session,
            animal_id=animal.id,
            file_url=file_url,
            file_key=file_key,
            mime_type=output_mime_type,
            size_bytes=optimized_size,
            is_primary=photo_count == 0,
        )
        await session.commit()
        await session.refresh(photo)
        return photo
    except Exception:
        await session.rollback()
        await delete_local_file(file_key)
        raise


async def list_photos(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
) -> list[AnimalPhoto]:
    animal = await get_owned_animal(session, current_user, animal_id)
    return await repository.list_photos(session, animal.id)


async def make_photo_primary(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
    photo_id: UUID,
) -> AnimalPhoto:
    animal = await get_owned_animal(session, current_user, animal_id)
    photo = await repository.get_photo(session, animal_id=animal.id, photo_id=photo_id)
    if photo is None:
        raise not_found("Animal photo not found")
    await repository.set_primary_photo(session, animal_id=animal.id, photo=photo)
    await session.commit()
    await session.refresh(photo)
    return photo


async def remove_photo(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
    photo_id: UUID,
) -> None:
    animal = await get_owned_animal(session, current_user, animal_id)
    photo = await repository.get_photo(session, animal_id=animal.id, photo_id=photo_id)
    if photo is None:
        raise not_found("Animal photo not found")
    was_primary = photo.is_primary
    file_key = photo.file_key
    await repository.delete_photo(session, photo)
    if was_primary:
        replacement = await repository.get_oldest_photo(session, animal.id)
        if replacement is not None:
            replacement.is_primary = True
            await session.flush()
    await session.commit()
    await delete_local_file(file_key)


def _sort_datetime(value: date | datetime) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
    return datetime.combine(value, time.min, tzinfo=UTC)


async def get_history(
    session: AsyncSession,
    current_user: User,
    animal_id: UUID,
) -> list[AnimalHistoryEvent]:
    animal = await get_owned_animal(session, current_user, animal_id)
    weights = await weight_repository.list_records(session, animal.id)
    health_records = await health_repository.list_records(session, animal.id)
    photos = await repository.list_photos(session, animal.id)

    events = [
        AnimalHistoryEvent(
            event_type="animal_created",
            occurred_at=animal.created_at,
            data={"animal_id": str(animal.id)},
        )
    ]
    events.extend(
        AnimalHistoryEvent(
            event_type="weight_recorded",
            occurred_at=record.recorded_at,
            data={"record_id": str(record.id), "weight_kg": record.weight_kg},
        )
        for record in weights
    )
    events.extend(
        AnimalHistoryEvent(
            event_type="health_recorded",
            occurred_at=record.recorded_at,
            data={
                "record_id": str(record.id),
                "record_type": record.record_type.value,
                "title": record.title,
            },
        )
        for record in health_records
    )
    events.extend(
        AnimalHistoryEvent(
            event_type="photo_uploaded",
            occurred_at=photo.uploaded_at,
            data={"photo_id": str(photo.id), "file_url": photo.file_url},
        )
        for photo in photos
    )
    return sorted(events, key=lambda event: _sort_datetime(event.occurred_at))
