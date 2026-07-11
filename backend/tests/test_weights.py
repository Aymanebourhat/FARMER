from collections.abc import Callable
from datetime import date, timedelta

from httpx import AsyncClient

from tests.helpers import create_animal, create_farmer


async def test_farmer_can_add_and_list_ordered_weights_for_own_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001101")
    animal = await create_animal(client, headers)
    today = date.today()

    for weight, recorded_at in [(43.0, today), (42.5, today - timedelta(days=1))]:
        response = await client.post(
            f"/api/v1/animals/{animal['id']}/weights",
            headers=headers,
            json={"weight_kg": weight, "recorded_at": str(recorded_at)},
        )
        assert response.status_code == 201, response.text

    list_response = await client.get(
        f"/api/v1/animals/{animal['id']}/weights",
        headers=headers,
    )
    assert list_response.status_code == 200
    assert [item["recorded_at"] for item in list_response.json()] == [
        str(today - timedelta(days=1)),
        str(today),
    ]


async def test_farmer_cannot_add_weight_to_another_farmers_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    owner = await create_farmer(client, auth_headers, phone="+212600001102")
    other = await create_farmer(client, auth_headers, phone="+212600001103")
    animal = await create_animal(client, owner)

    response = await client.post(
        f"/api/v1/animals/{animal['id']}/weights",
        headers=other,
        json={"weight_kg": 42.5, "recorded_at": str(date.today())},
    )

    assert response.status_code == 404


async def test_weight_validation_and_duplicate_date_conflict(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001104")
    animal = await create_animal(client, headers)
    endpoint = f"/api/v1/animals/{animal['id']}/weights"
    today = date.today()

    zero = await client.post(
        endpoint,
        headers=headers,
        json={"weight_kg": 0, "recorded_at": str(today)},
    )
    future = await client.post(
        endpoint,
        headers=headers,
        json={"weight_kg": 42.5, "recorded_at": str(today + timedelta(days=1))},
    )
    first = await client.post(
        endpoint,
        headers=headers,
        json={"weight_kg": 42.5, "recorded_at": str(today)},
    )
    duplicate = await client.post(
        endpoint,
        headers=headers,
        json={"weight_kg": 43, "recorded_at": str(today)},
    )

    assert zero.status_code == 422
    assert future.status_code == 422
    assert first.status_code == 201
    assert duplicate.status_code == 409
