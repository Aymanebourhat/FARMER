from collections.abc import Callable
from datetime import date, timedelta

from httpx import AsyncClient

from tests.helpers import create_animal, create_farmer


async def test_farmer_can_add_health_record_for_own_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001201")
    animal = await create_animal(client, headers)
    payload = {
        "record_type": "vaccine",
        "title": "Vaccination",
        "description": "Routine vaccination",
        "medicine_name": "Example medicine",
        "recorded_at": str(date.today()),
        "next_reminder_at": str(date.today() + timedelta(days=90)),
    }

    create_response = await client.post(
        f"/api/v1/animals/{animal['id']}/health-records",
        headers=headers,
        json=payload,
    )
    list_response = await client.get(
        f"/api/v1/animals/{animal['id']}/health-records",
        headers=headers,
    )

    assert create_response.status_code == 201, create_response.text
    assert create_response.json()["verification_status"] == "farmer_reported"
    assert list_response.status_code == 200
    assert [record["title"] for record in list_response.json()] == ["Vaccination"]


async def test_farmer_cannot_add_health_record_to_another_farmers_animal(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    owner = await create_farmer(client, auth_headers, phone="+212600001202")
    other = await create_farmer(client, auth_headers, phone="+212600001203")
    animal = await create_animal(client, owner)

    response = await client.post(
        f"/api/v1/animals/{animal['id']}/health-records",
        headers=other,
        json={"record_type": "note", "title": "Other", "recorded_at": str(date.today())},
    )

    assert response.status_code == 404


async def test_health_record_rejects_invalid_type_and_future_recorded_date(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001204")
    animal = await create_animal(client, headers)
    endpoint = f"/api/v1/animals/{animal['id']}/health-records"

    invalid_type = await client.post(
        endpoint,
        headers=headers,
        json={"record_type": "diagnosis", "title": "Invalid", "recorded_at": str(date.today())},
    )
    future = await client.post(
        endpoint,
        headers=headers,
        json={
            "record_type": "checkup",
            "title": "Future",
            "recorded_at": str(date.today() + timedelta(days=1)),
        },
    )

    assert invalid_type.status_code == 422
    assert future.status_code == 422
