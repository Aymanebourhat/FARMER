from collections.abc import Callable
from datetime import date, timedelta

from httpx import AsyncClient

from tests.helpers import ANIMAL_PAYLOAD, create_animal, create_farmer


async def test_farmer_can_create_animal_with_controlled_defaults(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001001")

    response = await client.post("/api/v1/animals", headers=headers, json=ANIMAL_PAYLOAD)

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["species"] == "sheep"
    assert body["ownership_status"] == "owned"
    assert body["verification_level"] == "self_reported"


async def test_vet_and_unauthenticated_user_cannot_create_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    vet_headers = await auth_headers(phone="+212600001002", role="vet")

    vet_response = await client.post(
        "/api/v1/animals",
        headers=vet_headers,
        json=ANIMAL_PAYLOAD,
    )
    anonymous_response = await client.post("/api/v1/animals", json=ANIMAL_PAYLOAD)

    assert vet_response.status_code == 403
    assert anonymous_response.status_code == 401


async def test_farmer_requires_profile_before_creating_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await auth_headers(phone="+212600001003")

    response = await client.post("/api/v1/animals", headers=headers, json=ANIMAL_PAYLOAD)

    assert response.status_code == 422


async def test_farmer_can_list_fetch_and_update_own_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001004")
    animal = await create_animal(client, headers)

    list_response = await client.get("/api/v1/animals", headers=headers)
    detail_response = await client.get(f"/api/v1/animals/{animal['id']}", headers=headers)
    update_response = await client.patch(
        f"/api/v1/animals/{animal['id']}",
        headers=headers,
        json={"breed": "Timahdite", "estimated_age_months": 18},
    )

    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [animal["id"]]
    assert detail_response.status_code == 200
    assert update_response.status_code == 200
    assert update_response.json()["breed"] == "Timahdite"
    assert update_response.json()["estimated_age_months"] == 18


async def test_soft_deleted_animal_disappears_and_returns_not_found(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001005")
    animal = await create_animal(client, headers)

    delete_response = await client.delete(f"/api/v1/animals/{animal['id']}", headers=headers)
    list_response = await client.get("/api/v1/animals", headers=headers)
    detail_response = await client.get(f"/api/v1/animals/{animal['id']}", headers=headers)

    assert delete_response.status_code == 204
    assert list_response.json() == []
    assert detail_response.status_code == 404


async def test_farmer_cannot_access_another_farmers_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    owner = await create_farmer(client, auth_headers, phone="+212600001006")
    other = await create_farmer(client, auth_headers, phone="+212600001007")
    animal = await create_animal(client, owner)

    responses = [
        await client.get(f"/api/v1/animals/{animal['id']}", headers=other),
        await client.patch(
            f"/api/v1/animals/{animal['id']}",
            headers=other,
            json={"breed": "Unauthorized"},
        ),
        await client.delete(f"/api/v1/animals/{animal['id']}", headers=other),
    ]

    assert all(response.status_code == 404 for response in responses)


async def test_animal_age_and_enum_validation(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001008")
    without_age = {**ANIMAL_PAYLOAD, "birth_date": None, "estimated_age_months": None}
    future_birth = {**ANIMAL_PAYLOAD, "birth_date": str(date.today() + timedelta(days=1))}
    invalid_enum = {**ANIMAL_PAYLOAD, "species": "horse"}

    responses = [
        await client.post("/api/v1/animals", headers=headers, json=without_age),
        await client.post("/api/v1/animals", headers=headers, json=future_birth),
        await client.post("/api/v1/animals", headers=headers, json=invalid_enum),
    ]

    assert all(response.status_code == 422 for response in responses)


async def test_animal_history_combines_registry_events(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001009")
    animal = await create_animal(client, headers)
    await client.post(
        f"/api/v1/animals/{animal['id']}/weights",
        headers=headers,
        json={"weight_kg": 42.5, "recorded_at": str(date.today())},
    )
    await client.post(
        f"/api/v1/animals/{animal['id']}/health-records",
        headers=headers,
        json={"record_type": "note", "title": "Observation", "recorded_at": str(date.today())},
    )

    response = await client.get(f"/api/v1/animals/{animal['id']}/history", headers=headers)

    assert response.status_code == 200, response.text
    assert {event["event_type"] for event in response.json()} == {
        "animal_created",
        "weight_recorded",
        "health_recorded",
    }
