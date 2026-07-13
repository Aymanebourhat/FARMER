from pathlib import Path, PurePosixPath
from uuid import UUID, uuid4

from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings


async def save_animal_photo(
    *,
    animal_id: UUID,
    content: bytes,
    extension: str,
) -> tuple[str, str]:
    if extension != ".jpg":
        raise ValueError("Animal photos must use the optimized JPEG extension")
    file_key = str(PurePosixPath("animals", str(animal_id), f"{uuid4().hex}{extension}"))
    root = Path(get_settings().local_upload_dir).resolve()
    destination = (root / Path(file_key)).resolve()
    if root != destination and root not in destination.parents:
        raise ValueError("Invalid upload destination")
    await run_in_threadpool(destination.parent.mkdir, parents=True, exist_ok=True)
    await run_in_threadpool(destination.write_bytes, content)
    return file_key, f"/uploads/{file_key}"


async def delete_local_file(file_key: str) -> None:
    root = Path(get_settings().local_upload_dir).resolve()
    destination = (root / Path(file_key)).resolve()
    if root != destination and root not in destination.parents:
        return

    def unlink_if_present() -> None:
        destination.unlink(missing_ok=True)

    await run_in_threadpool(unlink_if_present)


async def save_private_vet_document(*, vet_profile_id: UUID, content: bytes, extension: str) -> str:
    if extension not in {".pdf", ".jpg", ".png"}:
        raise ValueError("Unsupported vet document extension")
    file_key = str(PurePosixPath(str(vet_profile_id), f"{uuid4().hex}{extension}"))
    root = Path(get_settings().vet_document_upload_dir).resolve()
    destination = (root / Path(file_key)).resolve()
    if root != destination and root not in destination.parents:
        raise ValueError("Invalid private upload destination")
    await run_in_threadpool(destination.parent.mkdir, parents=True, exist_ok=True)
    await run_in_threadpool(destination.write_bytes, content)
    return file_key


def private_vet_document_path(file_key: str) -> Path | None:
    root = Path(get_settings().vet_document_upload_dir).resolve()
    destination = (root / Path(file_key)).resolve()
    return destination if (root == destination or root in destination.parents) else None


async def delete_private_vet_document(file_key: str | None) -> None:
    if not file_key:
        return
    destination = private_vet_document_path(file_key)
    if destination is not None:
        await run_in_threadpool(destination.unlink, missing_ok=True)
