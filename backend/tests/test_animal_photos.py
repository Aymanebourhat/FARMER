from collections.abc import Callable
from collections.abc import Generator
from io import BytesIO
from pathlib import Path
import shutil
from uuid import uuid4

import pytest
from httpx import AsyncClient
from PIL import Image

from app.core.config import get_settings
from tests.helpers import create_animal, create_farmer


def _image_bytes(
    image_format: str,
    *,
    size: tuple[int, int] = (64, 48),
    color: tuple[int, int, int] = (120, 80, 40),
) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", size, color).save(buffer, format=image_format)
    return buffer.getvalue()


JPEG = _image_bytes("JPEG")
PNG = _image_bytes("PNG")
WEBP = _image_bytes("WEBP")


@pytest.fixture(autouse=True)
def temporary_upload_directory(
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[None, None, None]:
    test_root = Path("C:/tmp/farmer_app_photo_tests").resolve()
    upload_dir = (test_root / uuid4().hex).resolve()
    if test_root not in upload_dir.parents:
        raise RuntimeError("Invalid test upload directory")
    upload_dir.mkdir(parents=True, exist_ok=False)
    monkeypatch.setattr(get_settings(), "local_upload_dir", str(upload_dir))
    yield
    shutil.rmtree(upload_dir)


async def _upload(
    client: AsyncClient,
    headers: dict[str, str],
    animal_id: str,
    *,
    filename: str,
    content: bytes,
    mime_type: str,
):
    return await client.post(
        f"/api/v1/animals/{animal_id}/photos",
        headers=headers,
        files={"file": (filename, content, mime_type)},
    )


async def test_photo_upload_accepts_jpeg_png_and_webp_for_owned_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001301")
    animal = await create_animal(client, headers)

    responses = [
        await _upload(
            client,
            headers,
            animal["id"],
            filename="unsafe.jpg",
            content=JPEG,
            mime_type="image/jpeg",
        ),
        await _upload(
            client,
            headers,
            animal["id"],
            filename="photo.png",
            content=PNG,
            mime_type="image/png",
        ),
        await _upload(
            client,
            headers,
            animal["id"],
            filename="photo.webp",
            content=WEBP,
            mime_type="image/webp",
        ),
    ]

    assert all(response.status_code == 201 for response in responses)
    assert responses[0].json()["is_primary"] is True
    assert all("unsafe" not in response.json()["file_url"] for response in responses)
    assert all(response.json()["mime_type"] == "image/jpeg" for response in responses)
    assert all(response.json()["file_url"].endswith(".jpg") for response in responses)


async def test_photo_upload_rejects_invalid_mime_and_oversized_file(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001302")
    animal = await create_animal(client, headers)

    invalid = await _upload(
        client,
        headers,
        animal["id"],
        filename="document.txt",
        content=b"not an image",
        mime_type="text/plain",
    )
    oversized = await _upload(
        client,
        headers,
        animal["id"],
        filename="large.jpg",
        content=JPEG + b"x" * (11 * 1024 * 1024 - len(JPEG)),
        mime_type="image/jpeg",
    )

    assert invalid.status_code == 422
    assert oversized.status_code == 422


async def test_photo_upload_saves_optimized_jpeg_and_records_optimized_size(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001308")
    animal = await create_animal(client, headers)
    raw_png = _image_bytes("PNG", size=(2400, 1200), color=(30, 140, 90))

    response = await _upload(
        client,
        headers,
        animal["id"],
        filename="../../do-not-trust-original.png",
        content=raw_png,
        mime_type="image/png",
    )

    assert response.status_code == 201, response.text
    photo = response.json()
    assert photo["mime_type"] == "image/jpeg"
    assert photo["file_url"].endswith(".jpg")
    assert "do-not-trust-original" not in photo["file_url"]

    relative_file_key = photo["file_url"].removeprefix("/uploads/")
    saved_path = Path(get_settings().local_upload_dir) / Path(relative_file_key)
    assert saved_path.is_file()
    assert saved_path.stat().st_size == photo["size_bytes"]
    assert saved_path.read_bytes().startswith(b"\xff\xd8\xff")
    with Image.open(saved_path) as saved_image:
        assert saved_image.format == "JPEG"
        assert max(saved_image.size) == 2048


async def test_photo_upload_rejects_more_than_five_photos(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001303")
    animal = await create_animal(client, headers)

    for index in range(5):
        response = await _upload(
            client,
            headers,
            animal["id"],
            filename=f"photo-{index}.jpg",
            content=JPEG + bytes([index]),
            mime_type="image/jpeg",
        )
        assert response.status_code == 201, response.text
    sixth = await _upload(
        client,
        headers,
        animal["id"],
        filename="photo-6.jpg",
        content=JPEG,
        mime_type="image/jpeg",
    )

    assert sixth.status_code == 422


async def test_primary_photo_endpoint_leaves_exactly_one_primary(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001304")
    animal = await create_animal(client, headers)
    first = await _upload(
        client,
        headers,
        animal["id"],
        filename="first.jpg",
        content=JPEG,
        mime_type="image/jpeg",
    )
    second = await _upload(
        client,
        headers,
        animal["id"],
        filename="second.png",
        content=PNG,
        mime_type="image/png",
    )

    primary_response = await client.patch(
        f"/api/v1/animals/{animal['id']}/photos/{second.json()['id']}/primary",
        headers=headers,
    )
    list_response = await client.get(
        f"/api/v1/animals/{animal['id']}/photos",
        headers=headers,
    )

    assert first.status_code == 201
    assert primary_response.status_code == 200
    photos = list_response.json()
    assert sum(photo["is_primary"] for photo in photos) == 1
    assert next(photo for photo in photos if photo["is_primary"])["id"] == second.json()["id"]


async def test_deleting_primary_photo_promotes_remaining_photo(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001305")
    animal = await create_animal(client, headers)
    first = await _upload(
        client,
        headers,
        animal["id"],
        filename="one.jpg",
        content=JPEG,
        mime_type="image/jpeg",
    )
    second = await _upload(
        client,
        headers,
        animal["id"],
        filename="two.png",
        content=PNG,
        mime_type="image/png",
    )

    delete_response = await client.delete(
        f"/api/v1/animals/{animal['id']}/photos/{first.json()['id']}",
        headers=headers,
    )
    list_response = await client.get(f"/api/v1/animals/{animal['id']}/photos", headers=headers)

    assert delete_response.status_code == 204
    assert list_response.json() == [{**second.json(), "is_primary": True}]


async def test_vet_cannot_upload_photo_for_farmer_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    farmer = await create_farmer(client, auth_headers, phone="+212600001306")
    vet = await auth_headers(phone="+212600001307", role="vet")
    animal = await create_animal(client, farmer)

    response = await _upload(
        client,
        vet,
        animal["id"],
        filename="vet.jpg",
        content=JPEG,
        mime_type="image/jpeg",
    )

    assert response.status_code == 403
