from collections.abc import Callable
from datetime import date, timedelta

from httpx import AsyncClient

from tests.helpers import create_animal, create_farmer


async def test_farmer_dashboard_requires_authentication(client: AsyncClient) -> None:
    response = await client.get("/api/v1/farmers/me/dashboard")

    assert response.status_code == 401


async def test_vet_cannot_access_farmer_dashboard(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await auth_headers(phone="+212600001401", role="vet")

    response = await client.get("/api/v1/farmers/me/dashboard", headers=headers)

    assert response.status_code == 403


async def test_farmer_with_no_animals_receives_zero_metrics(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await auth_headers(phone="+212600001402")

    response = await client.get("/api/v1/farmers/me/dashboard", headers=headers)

    assert response.status_code == 200, response.text
    assert response.json() == {
        "total_animals": 0,
        "animals_by_species": {
            "sheep": 0,
            "cow": 0,
            "goat": 0,
            "camel": 0,
            "other": 0,
        },
        "active_listings": 0,
        "ready_for_sale": 0,
        "health_alerts": 0,
        "latest_weight_updates": [],
        "recent_activity": [],
    }


async def test_total_animals_counts_only_own_non_deleted_animals(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    owner = await create_farmer(client, auth_headers, phone="+212600001403")
    other = await create_farmer(client, auth_headers, phone="+212600001404")
    kept = await create_animal(client, owner)
    deleted = await create_animal(client, owner, species="goat")
    await create_animal(client, other, species="cow")
    await client.delete(f"/api/v1/animals/{deleted['id']}", headers=owner)

    response = await client.get("/api/v1/farmers/me/dashboard", headers=owner)

    assert response.status_code == 200
    body = response.json()
    assert body["total_animals"] == 1
    assert body["animals_by_species"]["sheep"] == 1
    assert body["animals_by_species"]["goat"] == 0
    assert body["animals_by_species"]["cow"] == 0
    assert all(item.get("animal_id") != deleted["id"] for item in body["recent_activity"])
    assert any(item.get("animal_id") == kept["id"] for item in body["recent_activity"])


async def test_animals_by_species_and_ready_for_sale_use_owned_animals(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600001405")
    await create_animal(client, headers, species="sheep", sale_readiness="ready")
    await create_animal(client, headers, species="sheep", sale_readiness="not_ready")
    await create_animal(client, headers, species="camel", sale_readiness="ready")

    response = await client.get("/api/v1/farmers/me/dashboard", headers=headers)

    body = response.json()
    assert body["animals_by_species"] == {
        "sheep": 2,
        "cow": 0,
        "goat": 0,
        "camel": 1,
        "other": 0,
    }
    assert body["ready_for_sale"] == 2
    assert body["active_listings"] == 0


async def test_health_alerts_count_due_reminders_only_for_current_active_animals(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    owner = await create_farmer(client, auth_headers, phone="+212600001406")
    other = await create_farmer(client, auth_headers, phone="+212600001407")
    active = await create_animal(client, owner)
    deleted = await create_animal(client, owner, species="goat")
    foreign = await create_animal(client, other, species="cow")
    today = date.today()

    for title, reminder in [
        ("Past due", today - timedelta(days=1)),
        ("Due today", today),
        ("Future", today + timedelta(days=1)),
    ]:
        response = await client.post(
            f"/api/v1/animals/{active['id']}/health-records",
            headers=owner,
            json={
                "record_type": "checkup",
                "title": title,
                "recorded_at": str(today),
                "next_reminder_at": str(reminder),
            },
        )
        assert response.status_code == 201
    await client.post(
        f"/api/v1/animals/{deleted['id']}/health-records",
        headers=owner,
        json={
            "record_type": "note",
            "title": "Deleted reminder",
            "recorded_at": str(today),
            "next_reminder_at": str(today),
        },
    )
    await client.post(
        f"/api/v1/animals/{foreign['id']}/health-records",
        headers=other,
        json={
            "record_type": "note",
            "title": "Foreign reminder",
            "recorded_at": str(today),
            "next_reminder_at": str(today),
        },
    )
    await client.delete(f"/api/v1/animals/{deleted['id']}", headers=owner)

    response = await client.get("/api/v1/farmers/me/dashboard", headers=owner)

    assert response.json()["health_alerts"] == 2


async def test_latest_weight_updates_are_owned_ordered_limited_and_exclude_deleted(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    owner = await create_farmer(client, auth_headers, phone="+212600001408")
    other = await create_farmer(client, auth_headers, phone="+212600001409")
    active = await create_animal(client, owner, breed="Timahdite")
    deleted = await create_animal(client, owner, species="goat")
    foreign = await create_animal(client, other, species="cow")
    today = date.today()

    for offset in range(6):
        response = await client.post(
            f"/api/v1/animals/{active['id']}/weights",
            headers=owner,
            json={
                "weight_kg": 50 - offset,
                "recorded_at": str(today - timedelta(days=offset)),
                "note": f"Owner {offset}",
            },
        )
        assert response.status_code == 201
    await client.post(
        f"/api/v1/animals/{deleted['id']}/weights",
        headers=owner,
        json={"weight_kg": 99, "recorded_at": str(today)},
    )
    await client.post(
        f"/api/v1/animals/{foreign['id']}/weights",
        headers=other,
        json={"weight_kg": 88, "recorded_at": str(today)},
    )
    await client.delete(f"/api/v1/animals/{deleted['id']}", headers=owner)

    response = await client.get("/api/v1/farmers/me/dashboard", headers=owner)

    updates = response.json()["latest_weight_updates"]
    assert len(updates) == 5
    assert [item["note"] for item in updates] == [f"Owner {offset}" for offset in range(5)]
    assert all(item["animal_id"] == active["id"] for item in updates)
    assert all(item["animal_label"] == "Timahdite" for item in updates)


async def test_recent_activity_contains_only_real_owned_activity(
    client: AsyncClient,
    auth_headers: Callable[..., object],
) -> None:
    owner = await create_farmer(client, auth_headers, phone="+212600001410")
    other = await create_farmer(client, auth_headers, phone="+212600001411")
    animal = await create_animal(client, owner, breed="Sardi")
    foreign = await create_animal(client, other, species="cow")
    today = date.today()
    await client.post(
        f"/api/v1/animals/{animal['id']}/weights",
        headers=owner,
        json={"weight_kg": 42.5, "recorded_at": str(today)},
    )
    await client.post(
        f"/api/v1/animals/{animal['id']}/health-records",
        headers=owner,
        json={"record_type": "vaccine", "title": "PPR", "recorded_at": str(today)},
    )
    await client.post(
        f"/api/v1/animals/{foreign['id']}/weights",
        headers=other,
        json={"weight_kg": 80, "recorded_at": str(today)},
    )

    response = await client.get("/api/v1/farmers/me/dashboard", headers=owner)

    activity = response.json()["recent_activity"]
    assert len(activity) <= 10
    assert {"animal_created", "weight_recorded", "health_recorded"} <= {
        item["type"] for item in activity
    }
    assert all(item.get("animal_id") != foreign["id"] for item in activity)
    assert all({"type", "title", "date", "animal_id"} <= item.keys() for item in activity)
