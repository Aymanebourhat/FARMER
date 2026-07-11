from uuid import UUID

from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.animals import service
from app.modules.animals.schemas import (
    AnimalCreate,
    AnimalHistoryEvent,
    AnimalPhotoRead,
    AnimalRead,
    AnimalUpdate,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models import User


router = APIRouter(prefix="/animals", tags=["animals"])


@router.get("", response_model=list[AnimalRead])
async def list_animals(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AnimalRead]:
    return [
        AnimalRead.model_validate(animal)
        for animal in await service.list_animals(session, current_user)
    ]


@router.post("", response_model=AnimalRead, status_code=status.HTTP_201_CREATED)
async def create_animal(
    payload: AnimalCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnimalRead:
    return AnimalRead.model_validate(await service.create_animal(session, current_user, payload))


@router.get("/{animal_id}", response_model=AnimalRead)
async def read_animal(
    animal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnimalRead:
    return AnimalRead.model_validate(
        await service.read_animal(session, current_user, animal_id)
    )


@router.patch("/{animal_id}", response_model=AnimalRead)
async def update_animal(
    animal_id: UUID,
    payload: AnimalUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnimalRead:
    return AnimalRead.model_validate(
        await service.update_animal(session, current_user, animal_id, payload)
    )


@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_animal(
    animal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Response:
    await service.delete_animal(session, current_user, animal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{animal_id}/history", response_model=list[AnimalHistoryEvent])
async def read_animal_history(
    animal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AnimalHistoryEvent]:
    return await service.get_history(session, current_user, animal_id)


@router.post(
    "/{animal_id}/photos",
    response_model=AnimalPhotoRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_animal_photo(
    animal_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnimalPhotoRead:
    return AnimalPhotoRead.model_validate(
        await service.upload_photo(session, current_user, animal_id, file)
    )


@router.get("/{animal_id}/photos", response_model=list[AnimalPhotoRead])
async def list_animal_photos(
    animal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AnimalPhotoRead]:
    return [
        AnimalPhotoRead.model_validate(photo)
        for photo in await service.list_photos(session, current_user, animal_id)
    ]


@router.delete(
    "/{animal_id}/photos/{photo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_animal_photo(
    animal_id: UUID,
    photo_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Response:
    await service.remove_photo(session, current_user, animal_id, photo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(
    "/{animal_id}/photos/{photo_id}/primary",
    response_model=AnimalPhotoRead,
)
async def set_primary_animal_photo(
    animal_id: UUID,
    photo_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnimalPhotoRead:
    return AnimalPhotoRead.model_validate(
        await service.make_photo_primary(session, current_user, animal_id, photo_id)
    )
