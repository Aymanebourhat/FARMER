from collections.abc import Callable
from typing import Any

from httpx import AsyncClient


ANIMAL_PAYLOAD: dict[str, Any] = {
    "species": "sheep",
    "breed": "Sardi",
    "sex": "male",
    "birth_date": "2025-02-10",
    "estimated_age_months": None,
    "health_status": "healthy",
    "sale_readiness": "not_ready",
    "identification_notes": "White head, black mark on left leg",
}


async def create_farmer(
    client: AsyncClient,
    auth_headers: Callable[..., object],
    *,
    phone: str,
) -> dict[str, str]:
    headers = await auth_headers(phone=phone)
    response = await client.patch(
        "/api/v1/farmers/me",
        headers=headers,
        json={"region": "Marrakech-Safi", "province": "Marrakech"},
    )
    assert response.status_code == 200, response.text
    return headers


async def create_animal(
    client: AsyncClient,
    headers: dict[str, str],
    **overrides: Any,
) -> dict[str, Any]:
    payload = {**ANIMAL_PAYLOAD, **overrides}
    response = await client.post("/api/v1/animals", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()
