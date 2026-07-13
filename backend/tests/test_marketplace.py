from collections.abc import Callable
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.animals.models import Animal, AnimalOwnershipStatus, AnimalPhoto
from app.modules.farmers.models import FarmerProfile
from app.modules.marketplace.models import ListingReport, ListingStatus, MarketplaceListing
from app.modules.marketplace.service import calculate_trust_score
from app.modules.users.models import User
from tests.helpers import create_animal, create_farmer


LISTING = {"title": "Sardi sheep for sale", "description": "Healthy animal", "price_mad": "4500.00", "contact_phone": "+212600000000", "contact_whatsapp": "+212600000000"}


async def add_photo(db: AsyncSession, animal_id: str, *, number: int = 1) -> None:
    for index in range(number):
        db.add(AnimalPhoto(animal_id=UUID(animal_id), file_url=f"/uploads/animals/{animal_id}/{uuid4().hex}.jpg", file_key=f"animals/{animal_id}/{uuid4().hex}.jpg", mime_type="image/jpeg", size_bytes=100, is_primary=index == 0))
    await db.commit()


async def eligible(client, db, auth_headers, phone="+212600002001", **animal_overrides):
    headers = await create_farmer(client, auth_headers, phone=phone)
    animal = await create_animal(client, headers, **animal_overrides)
    await add_photo(db, animal["id"])
    return headers, animal


async def create_listing(client, headers, animal_id, **overrides):
    return await client.post("/api/v1/marketplace/listings", headers=headers, json={"animal_id": animal_id, **LISTING, **overrides})


async def test_listing_creation_rules_and_transactional_status(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    headers, animal = await eligible(client, db_session, auth_headers)
    response = await create_listing(client, headers, animal["id"])
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["status"] == "active"
    assert body["region"] == "Marrakech-Safi" and body["province"] == "Marrakech"
    expiry = datetime.fromisoformat(body["expires_at"])
    assert timedelta(days=29, hours=23) < expiry - datetime.now(UTC) < timedelta(days=30, minutes=1)
    stored = await db_session.get(Animal, UUID(animal["id"]))
    assert stored.ownership_status == AnimalOwnershipStatus.LISTED
    duplicate = await create_listing(client, headers, animal["id"])
    assert duplicate.status_code == 409
    assert (await db_session.get(Animal, UUID(animal["id"]))).ownership_status == AnimalOwnershipStatus.LISTED


async def test_listing_create_requires_auth_farmer_profile_ownership_photo_and_positive_price(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, animal = await eligible(client, db_session, auth_headers, phone="+212600002002")
    assert (await create_listing(client, {}, animal["id"])).status_code == 401
    vet = await auth_headers(phone="+212600002003", role="vet")
    assert (await create_listing(client, vet, animal["id"])).status_code == 403
    no_profile = await auth_headers(phone="+212600002004")
    assert (await create_listing(client, no_profile, animal["id"])).status_code == 422
    other = await create_farmer(client, auth_headers, phone="+212600002005")
    assert (await create_listing(client, other, animal["id"])).status_code == 404
    no_photo = await create_animal(client, owner, species="goat")
    assert (await create_listing(client, owner, no_photo["id"])).status_code == 409
    assert (await create_listing(client, owner, animal["id"], price_mad=0)).status_code == 422


async def test_deleted_sold_and_dead_animals_cannot_be_listed(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600002006")
    for index, ownership in enumerate(("sold", "dead")):
        animal = await create_animal(client, headers, species="goat", ownership_status=ownership)
        await add_photo(db_session, animal["id"])
        assert (await create_listing(client, headers, animal["id"])).status_code == 409
    deleted = await create_animal(client, headers, species="cow")
    await add_photo(db_session, deleted["id"])
    await client.delete(f"/api/v1/animals/{deleted['id']}", headers=headers)
    assert (await create_listing(client, headers, deleted["id"])).status_code == 404


async def test_public_browse_detail_safe_photos_pagination_and_filters(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    headers, sheep = await eligible(client, db_session, auth_headers, phone="+212600002007", sale_readiness="ready")
    await client.post(f"/api/v1/animals/{sheep['id']}/weights", headers=headers, json={"weight_kg": 42, "recorded_at": str(date.today())})
    listing = (await create_listing(client, headers, sheep["id"])).json()
    browse = await client.get("/api/v1/marketplace/listings", params={"species": "sheep", "region": "Marrakech-Safi", "province": "Marrakech", "min_price": 4000, "max_price": 5000, "min_weight": 40, "max_weight": 45, "sex": "male", "sale_readiness": "ready", "page_size": 1})
    assert browse.status_code == 200, browse.text
    assert browse.json()["total"] == 1 and browse.json()["pages"] == 1
    item = browse.json()["items"][0]
    assert item["animal"]["primary_photo_url"].startswith("/uploads/")
    assert item["animal"]["latest_weight_kg"] == "42.00"
    assert item["animal"]["verification_label"] == "Farmer-reported data"
    detail = await client.get(f"/api/v1/marketplace/listings/{listing['id']}")
    text = detail.text
    assert detail.status_code == 200
    assert all(secret not in text for secret in ("password_hash", "identification_notes", "commune", "file_key", "phone_verified", "reports"))
    assert (await client.get("/api/v1/marketplace/listings", params={"species": "cow"})).json()["total"] == 0


async def test_invalid_filters_and_sort_orders(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600002008")
    for price in (3000, 5000):
        animal = await create_animal(client, headers)
        await add_photo(db_session, animal["id"])
        assert (await create_listing(client, headers, animal["id"], price_mad=price)).status_code == 201
    assert (await client.get("/api/v1/marketplace/listings", params={"region": "Marrakech-Safi", "province": "Casablanca"})).status_code == 422
    assert (await client.get("/api/v1/marketplace/listings", params={"min_price": 6, "max_price": 5})).status_code == 422
    low = (await client.get("/api/v1/marketplace/listings", params={"sort": "price_low_to_high"})).json()["items"]
    high = (await client.get("/api/v1/marketplace/listings", params={"sort": "price_high_to_low"})).json()["items"]
    assert [x["price_mad"] for x in low] == ["3000.00", "5000.00"]
    assert [x["price_mad"] for x in high] == ["5000.00", "3000.00"]


async def test_public_excludes_hidden_expired_and_deleted_animal(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    headers = await create_farmer(client, auth_headers, phone="+212600002009")
    listing_ids = []
    for state in (ListingStatus.SOLD, ListingStatus.SUSPENDED, ListingStatus.DRAFT, ListingStatus.ACTIVE):
        animal = await create_animal(client, headers)
        await add_photo(db_session, animal["id"])
        created = (await create_listing(client, headers, animal["id"])).json()
        row = await db_session.get(MarketplaceListing, UUID(created["id"]))
        row.status = state
        if state == ListingStatus.ACTIVE:
            row.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        listing_ids.append(created["id"])
    animal = await create_animal(client, headers)
    await add_photo(db_session, animal["id"])
    deleted_listing = (await create_listing(client, headers, animal["id"])).json()
    (await db_session.get(Animal, UUID(animal["id"]))).deleted_at = datetime.now(UTC)
    await db_session.commit()
    assert (await client.get("/api/v1/marketplace/listings")).json()["total"] == 0
    for listing_id in listing_ids + [deleted_listing["id"]]:
        assert (await client.get(f"/api/v1/marketplace/listings/{listing_id}")).status_code == 404


async def test_owner_update_field_allowlist_and_ownership_hiding(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, animal = await eligible(client, db_session, auth_headers, phone="+212600002010")
    other = await create_farmer(client, auth_headers, phone="+212600002011")
    listing = (await create_listing(client, owner, animal["id"])).json()
    updated = await client.patch(f"/api/v1/marketplace/listings/{listing['id']}", headers=owner, json={"title": "Updated", "price_mad": "4600.00"})
    assert updated.status_code == 200 and updated.json()["title"] == "Updated"
    assert (await client.patch(f"/api/v1/marketplace/listings/{listing['id']}", headers=other, json={"title": "Hack"})).status_code == 404
    for field, value in (("animal_id", str(uuid4())), ("trust_score", 99), ("status", "sold")):
        assert (await client.patch(f"/api/v1/marketplace/listings/{listing['id']}", headers=owner, json={field: value})).status_code == 422
    assert (await client.patch(f"/api/v1/marketplace/listings/{listing['id']}", headers=owner, json={"price_mad": 0})).status_code == 422


async def test_mark_sold_lifecycle_and_dashboard(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, animal = await eligible(client, db_session, auth_headers, phone="+212600002012")
    other = await create_farmer(client, auth_headers, phone="+212600002013")
    listing = (await create_listing(client, owner, animal["id"])).json()
    assert (await client.get("/api/v1/farmers/me/dashboard", headers=owner)).json()["active_listings"] == 1
    assert (await client.post(f"/api/v1/marketplace/listings/{listing['id']}/mark-sold", headers=other)).status_code == 404
    sold = await client.post(f"/api/v1/marketplace/listings/{listing['id']}/mark-sold", headers=owner)
    assert sold.status_code == 200 and sold.json()["status"] == "sold"
    assert (await db_session.get(Animal, UUID(animal["id"]))).ownership_status == AnimalOwnershipStatus.SOLD
    assert (await client.get(f"/api/v1/marketplace/listings/{listing['id']}")).status_code == 404
    assert (await client.get("/api/v1/farmers/me/dashboard", headers=owner)).json()["active_listings"] == 0
    assert (await client.post(f"/api/v1/marketplace/listings/{listing['id']}/mark-sold", headers=owner)).status_code == 409


async def test_renew_expired_listing_and_block_invalid_animals(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, animal = await eligible(client, db_session, auth_headers, phone="+212600002014")
    listing = (await create_listing(client, owner, animal["id"])).json()
    row = await db_session.get(MarketplaceListing, UUID(listing["id"]))
    row.status = ListingStatus.EXPIRED
    row.expires_at = datetime.now(UTC) - timedelta(days=1)
    (await db_session.get(Animal, UUID(animal["id"]))).ownership_status = AnimalOwnershipStatus.OWNED
    await db_session.commit()
    renewed = await client.post(f"/api/v1/marketplace/listings/{listing['id']}/renew", headers=owner)
    assert renewed.status_code == 200, renewed.text
    assert renewed.json()["status"] == "active"
    assert datetime.fromisoformat(renewed.json()["expires_at"]) - datetime.now(UTC) > timedelta(days=29)
    assert (await db_session.get(Animal, UUID(animal["id"]))).ownership_status == AnimalOwnershipStatus.LISTED
    assert (await client.post(f"/api/v1/marketplace/listings/{listing['id']}/renew", headers=owner)).status_code == 409


async def test_guest_authenticated_reports_and_duplicate_protection(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, animal = await eligible(client, db_session, auth_headers, phone="+212600002015")
    reporter = await auth_headers(phone="+212600002016", role="vet")
    listing = (await create_listing(client, owner, animal["id"])).json()
    guest = await client.post(f"/api/v1/marketplace/listings/{listing['id']}/report", json={"reason": "scam", "description": "Suspicious"})
    assert guest.status_code == 201 and guest.json()["reporter_user_id"] is None and guest.json()["status"] == "pending"
    auth = await client.post(f"/api/v1/marketplace/listings/{listing['id']}/report", headers=reporter, json={"reason": "fake"})
    assert auth.status_code == 201 and auth.json()["reporter_user_id"] is not None
    assert (await client.post(f"/api/v1/marketplace/listings/{listing['id']}/report", headers=reporter, json={"reason": "fake"})).status_code == 409
    assert (await client.post(f"/api/v1/marketplace/listings/{listing['id']}/report", json={"reason": "invalid"})).status_code == 422
    row = await db_session.get(MarketplaceListing, UUID(listing["id"]))
    row.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    await db_session.commit()
    assert (await client.post(f"/api/v1/marketplace/listings/{listing['id']}/report", json={"reason": "sold"})).status_code == 404


def test_trust_score_helper_points_and_cap() -> None:
    assert calculate_trust_score(phone_verified=False, photo_count=1, has_weight=False, has_health=False, profile_completion_score=0, report_count=0) == 30
    assert calculate_trust_score(phone_verified=True, photo_count=3, has_weight=True, has_health=True, profile_completion_score=100, report_count=0) == 100
    assert calculate_trust_score(phone_verified=False, photo_count=3, has_weight=True, has_health=True, profile_completion_score=100, report_count=1) == 70
    base = dict(phone_verified=False, photo_count=0, has_weight=False, has_health=False, profile_completion_score=0, report_count=1)
    assert calculate_trust_score(**{**base, "phone_verified": True}) == 20
    assert calculate_trust_score(**{**base, "photo_count": 1}) == 20
    assert calculate_trust_score(**{**base, "photo_count": 3}) == 30
    assert calculate_trust_score(**{**base, "has_weight": True}) == 15
    assert calculate_trust_score(**{**base, "has_health": True}) == 15
    assert calculate_trust_score(**{**base, "profile_completion_score": 100}) == 10
    assert calculate_trust_score(**{**base, "report_count": 0}) == 10


async def test_renew_blocks_sold_dead_and_other_active_listing(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner = await create_farmer(client, auth_headers, phone="+212600002017")
    for ownership in (AnimalOwnershipStatus.SOLD, AnimalOwnershipStatus.DEAD):
        animal = await create_animal(client, owner)
        await add_photo(db_session, animal["id"])
        created = (await create_listing(client, owner, animal["id"])).json()
        listing = await db_session.get(MarketplaceListing, UUID(created["id"]))
        listing.status = ListingStatus.EXPIRED
        listing.expires_at = datetime.now(UTC) - timedelta(days=1)
        (await db_session.get(Animal, UUID(animal["id"]))).ownership_status = ownership
        await db_session.commit()
        assert (await client.post(f"/api/v1/marketplace/listings/{created['id']}/renew", headers=owner)).status_code == 409

    animal = await create_animal(client, owner)
    await add_photo(db_session, animal["id"])
    old = (await create_listing(client, owner, animal["id"])).json()
    old_row = await db_session.get(MarketplaceListing, UUID(old["id"]))
    old_row.status = ListingStatus.EXPIRED
    old_row.expires_at = datetime.now(UTC) - timedelta(days=1)
    await db_session.commit()
    assert (await create_listing(client, owner, animal["id"])).status_code == 201
    assert (await client.post(f"/api/v1/marketplace/listings/{old['id']}/renew", headers=owner)).status_code == 409


async def test_dashboard_excludes_expired_and_other_farmer_listings(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, animal = await eligible(client, db_session, auth_headers, phone="+212600002018")
    other, other_animal = await eligible(client, db_session, auth_headers, phone="+212600002019")
    own_listing = (await create_listing(client, owner, animal["id"])).json()
    assert (await create_listing(client, other, other_animal["id"])).status_code == 201
    assert (await client.get("/api/v1/farmers/me/dashboard", headers=owner)).json()["active_listings"] == 1
    row = await db_session.get(MarketplaceListing, UUID(own_listing["id"]))
    row.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    await db_session.commit()
    assert (await client.get("/api/v1/farmers/me/dashboard", headers=owner)).json()["active_listings"] == 0
