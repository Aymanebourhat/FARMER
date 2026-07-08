from collections.abc import Callable

from httpx import AsyncClient


async def test_get_farmer_profile_requires_existing_profile(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await auth_headers(phone="+212600000201")

    response = await client.get("/api/v1/farmers/me", headers=headers)

    assert response.status_code == 404


async def test_farmer_profile_patch_upserts_and_get_returns_profile(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await auth_headers(phone="+212600000202")

    create_response = await client.patch(
        "/api/v1/farmers/me",
        headers=headers,
        json={
            "farm_name": "Atlas Farm",
            "region": "Marrakech-Safi",
            "province": "Marrakech",
            "commune": "Amizmiz",
            "main_livestock_type": "sheep",
            "farm_size_label": "small",
        },
    )

    assert create_response.status_code == 200, create_response.text
    body = create_response.json()
    assert body["region"] == "Marrakech-Safi"
    assert body["province"] == "Marrakech"
    assert body["profile_completion_score"] == 100

    update_response = await client.patch(
        "/api/v1/farmers/me",
        headers=headers,
        json={"farm_name": "Atlas Farm Updated"},
    )

    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["farm_name"] == "Atlas Farm Updated"
    assert update_response.json()["profile_completion_score"] == 100

    get_response = await client.get("/api/v1/farmers/me", headers=headers)

    assert get_response.status_code == 200, get_response.text
    assert get_response.json()["farm_name"] == "Atlas Farm Updated"


async def test_farmer_profile_create_requires_region_and_province(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await auth_headers(phone="+212600000203")

    response = await client.patch(
        "/api/v1/farmers/me",
        headers=headers,
        json={"farm_name": "Incomplete Farm"},
    )

    assert response.status_code == 422


async def test_farmer_profile_rejects_invalid_region_province_pair(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await auth_headers(phone="+212600000204")

    response = await client.patch(
        "/api/v1/farmers/me",
        headers=headers,
        json={
            "region": "Marrakech-Safi",
            "province": "Casablanca",
        },
    )

    assert response.status_code == 422


async def test_vet_cannot_access_farmer_profile_endpoints(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await auth_headers(phone="+212600000205", role="vet")

    get_response = await client.get("/api/v1/farmers/me", headers=headers)
    patch_response = await client.patch(
        "/api/v1/farmers/me",
        headers=headers,
        json={"region": "Marrakech-Safi", "province": "Marrakech"},
    )

    assert get_response.status_code == 403
    assert patch_response.status_code == 403
