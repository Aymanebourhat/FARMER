from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from uuid import UUID

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.animals.models import Animal, AnimalOwnershipStatus, AnimalPhoto
from app.modules.marketplace.models import ListingReport, ListingStatus, MarketplaceListing, ReportStatus
from app.modules.users.models import User, UserRole, UserStatus
from tests.helpers import create_animal, create_farmer


LISTING = {
    "title": "Admin moderation listing",
    "description": "Safe description",
    "price_mad": "4100.00",
    "contact_phone": "+212600000000",
}


async def make_admin(db: AsyncSession, client: AsyncClient, auth_headers: Callable[..., object], phone: str = "+212600008001") -> tuple[dict[str, str], User]:
    headers = await auth_headers(phone=phone)
    token_user = (await client.get("/api/v1/auth/me", headers=headers)).json()
    user = await db.get(User, UUID(token_user["id"]))
    user.role = UserRole.ADMIN
    await db.commit()
    return headers, user


async def make_listing(client: AsyncClient, db: AsyncSession, auth_headers: Callable[..., object], phone: str = "+212600008002"):
    headers = await create_farmer(client, auth_headers, phone=phone)
    animal = await create_animal(client, headers)
    db.add(AnimalPhoto(animal_id=UUID(animal["id"]), file_url="/uploads/animals/test.jpg", file_key=f"animals/{animal['id']}/test.jpg", mime_type="image/jpeg", size_bytes=100, is_primary=True))
    await db.commit()
    response = await client.post("/api/v1/marketplace/listings", headers=headers, json={"animal_id": animal["id"], **LISTING})
    assert response.status_code == 201, response.text
    return headers, response.json(), animal


async def test_admin_authorization_stats_and_security_headers(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    farmer = await auth_headers(phone="+212600008010")
    vet = await auth_headers(phone="+212600008011", role="vet")
    admin, _ = await make_admin(db_session, client, auth_headers, "+212600008012")
    assert (await client.get("/api/v1/admin/stats")).status_code == 401
    assert (await client.get("/api/v1/admin/stats", headers=farmer)).status_code == 403
    assert (await client.get("/api/v1/admin/stats", headers=vet)).status_code == 403
    response = await client.get("/api/v1/admin/stats", headers=admin)
    assert response.status_code == 200, response.text
    assert response.json()["total_users"] == 3
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert (await client.get("/api/v1/marketplace/listings", headers={"Authorization": "Bearer invalid"})).status_code == 200
    assert (await client.post("/api/v1/marketplace/listings/00000000-0000-0000-0000-000000000000/report", headers={"Authorization": "Bearer invalid"}, json={"reason": "fake"})).status_code == 401


async def test_user_suspension_visibility_activation_and_audit(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, listing, _ = await make_listing(client, db_session, auth_headers, "+212600008020")
    admin, admin_user = await make_admin(db_session, client, auth_headers, "+212600008021")
    owner_id = (await client.get("/api/v1/auth/me", headers=owner)).json()["id"]
    users = await client.get("/api/v1/admin/users", headers=admin, params={"role": "farmer", "search": "+212600008020", "page_size": 1})
    assert users.status_code == 200 and users.json()["total"] == 1
    assert (await client.patch(f"/api/v1/admin/users/{owner_id}/suspend", headers=admin, json={})).status_code == 422
    suspended = await client.patch(f"/api/v1/admin/users/{owner_id}/suspend", headers=admin, json={"reason": "Repeated fraudulent activity"})
    assert suspended.status_code == 200 and suspended.json()["status"] == "suspended"
    assert (await client.get("/api/v1/auth/me", headers=owner)).status_code == 403
    assert (await client.post("/api/v1/auth/login", json={"phone": "+212600008020", "password": "secure-password"})).status_code == 403
    assert (await client.get(f"/api/v1/marketplace/listings/{listing['id']}")).status_code == 404
    assert (await client.patch(f"/api/v1/admin/users/{admin_user.id}/suspend", headers=admin, json={"reason": "Not allowed"})).status_code == 409
    activated = await client.patch(f"/api/v1/admin/users/{owner_id}/activate", headers=admin)
    assert activated.status_code == 200 and activated.json()["status"] == "active"
    assert (await client.get(f"/api/v1/marketplace/listings/{listing['id']}")).status_code == 200
    logs = await client.get("/api/v1/admin/audit-logs", headers=admin, params={"target_type": "user"})
    assert logs.status_code == 200 and logs.json()["total"] == 2
    assert all("password" not in str(item["metadata_json"]).lower() for item in logs.json()["items"])


async def test_listing_moderation_and_report_lifecycle(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, listing, animal = await make_listing(client, db_session, auth_headers, "+212600008030")
    admin, _ = await make_admin(db_session, client, auth_headers, "+212600008031")
    report = await client.post(f"/api/v1/marketplace/listings/{listing['id']}/report", json={"reason": "scam", "description": "Suspicious listing"})
    assert report.status_code == 201
    queue = await client.get("/api/v1/admin/listings", headers=admin, params={"has_reports": "true", "sort": "most_reported"})
    assert queue.status_code == 200 and queue.json()["items"][0]["report_count"] == 1
    detail = await client.get(f"/api/v1/admin/listings/{listing['id']}", headers=admin)
    assert detail.status_code == 200 and detail.json()["reports"][0]["reason"] == "scam"
    assert (await client.patch(f"/api/v1/admin/listings/{listing['id']}/suspend", headers=admin, json={"reason": "Misleading sale information"})).status_code == 200
    assert (await client.get(f"/api/v1/marketplace/listings/{listing['id']}")).status_code == 404
    assert (await db_session.get(Animal, UUID(animal["id"]))).ownership_status == AnimalOwnershipStatus.LISTED
    restored = await client.patch(f"/api/v1/admin/listings/{listing['id']}/restore", headers=admin)
    assert restored.status_code == 200 and restored.json()["status"] == "active"
    reports = await client.get("/api/v1/admin/reports", headers=admin, params={"status": "pending", "reason": "scam"})
    report_id = reports.json()["items"][0]["id"]
    dismissed = await client.patch(f"/api/v1/admin/reports/{report_id}/dismiss", headers=admin, json={"note": "No violation found"})
    assert dismissed.status_code == 200 and dismissed.json()["status"] == "dismissed"
    assert (await db_session.get(MarketplaceListing, UUID(listing["id"]))).status == ListingStatus.ACTIVE
    assert (await client.patch(f"/api/v1/admin/reports/{report_id}/dismiss", headers=admin, json={"note": "Again"})).status_code == 409


async def test_report_resolution_suspends_listing_transactionally(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    _, listing, _ = await make_listing(client, db_session, auth_headers, "+212600008040")
    admin, _ = await make_admin(db_session, client, auth_headers, "+212600008041")
    report = (await client.post(f"/api/v1/marketplace/listings/{listing['id']}/report", json={"reason": "fake"})).json()
    resolved = await client.patch(f"/api/v1/admin/reports/{report['id']}/resolve", headers=admin, json={"action": "suspend_listing", "note": "Listing is fraudulent"})
    assert resolved.status_code == 200, resolved.text
    assert resolved.json()["status"] == "action_taken"
    stored = await db_session.get(ListingReport, UUID(report["id"]))
    assert stored.reviewed_by_admin_id is not None and stored.reviewed_at is not None
    assert (await db_session.get(MarketplaceListing, UUID(listing["id"]))).status == ListingStatus.SUSPENDED
    logs = await client.get("/api/v1/admin/audit-logs", headers=admin)
    actions = {item["action"] for item in logs.json()["items"]}
    assert {"listing.suspended", "report.resolved"} <= actions
    assert (await client.get("/api/v1/admin/audit-logs")).status_code == 401



async def test_non_admin_user_administration_is_forbidden(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    farmer = await auth_headers(phone="+212600008050")
    vet = await auth_headers(phone="+212600008051", role="vet")
    admin, admin_user = await make_admin(db_session, client, auth_headers, "+212600008052")
    assert (await client.get("/api/v1/admin/users", headers=farmer)).status_code == 403
    assert (await client.get(f"/api/v1/admin/users/{admin_user.id}", headers=vet)).status_code == 403
    assert (await client.get(f"/api/v1/admin/users/{admin_user.id}", headers=admin)).status_code == 200


async def test_admin_cannot_suspend_another_admin(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    actor, _ = await make_admin(db_session, client, auth_headers, "+212600008060")
    _, target = await make_admin(db_session, client, auth_headers, "+212600008061")
    response = await client.patch(f"/api/v1/admin/users/{target.id}/suspend", headers=actor, json={"reason": "This must be rejected"})
    assert response.status_code == 409
    await db_session.refresh(target)
    assert target.status == UserStatus.ACTIVE


async def test_expired_suspended_listing_restores_as_expired(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    _, listing, _ = await make_listing(client, db_session, auth_headers, "+212600008070")
    admin, _ = await make_admin(db_session, client, auth_headers, "+212600008071")
    row = await db_session.get(MarketplaceListing, UUID(listing["id"]))
    row.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    await db_session.commit()
    assert (await client.patch(f"/api/v1/admin/listings/{listing['id']}/suspend", headers=admin, json={"reason": "Administrative review"})).status_code == 200
    restored = await client.patch(f"/api/v1/admin/listings/{listing['id']}/restore", headers=admin)
    assert restored.status_code == 200 and restored.json()["status"] == "expired"
    assert (await client.get(f"/api/v1/marketplace/listings/{listing['id']}")).status_code == 404


async def test_report_resolution_can_suspend_farmer(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    owner, listing, _ = await make_listing(client, db_session, auth_headers, "+212600008080")
    admin, _ = await make_admin(db_session, client, auth_headers, "+212600008081")
    report = (await client.post(f"/api/v1/marketplace/listings/{listing['id']}/report", json={"reason": "scam"})).json()
    resolved = await client.patch(f"/api/v1/admin/reports/{report['id']}/resolve", headers=admin, json={"action": "suspend_farmer", "note": "Repeated marketplace fraud"})
    assert resolved.status_code == 200 and resolved.json()["status"] == "action_taken"
    assert (await client.get("/api/v1/auth/me", headers=owner)).status_code == 403
    assert (await client.get(f"/api/v1/marketplace/listings/{listing['id']}")).status_code == 404


async def test_audit_filters_and_write_methods(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    target = await auth_headers(phone="+212600008090")
    target_id = (await client.get("/api/v1/auth/me", headers=target)).json()["id"]
    admin, admin_user = await make_admin(db_session, client, auth_headers, "+212600008091")
    await client.patch(f"/api/v1/admin/users/{target_id}/suspend", headers=admin, json={"reason": "Verified moderation reason"})
    filtered = await client.get("/api/v1/admin/audit-logs", headers=admin, params={"action": "user.suspended", "target_type": "user", "admin_user_id": str(admin_user.id), "sort": "oldest"})
    assert filtered.status_code == 200 and filtered.json()["total"] == 1
    log_id = filtered.json()["items"][0]["id"]
    assert (await client.patch(f"/api/v1/admin/audit-logs/{log_id}", headers=admin, json={})).status_code in {404, 405}


async def test_admin_suspends_approved_vet_visibility_and_reactivation(client: AsyncClient, db_session: AsyncSession, auth_headers: Callable[..., object]) -> None:
    vet = await auth_headers(phone="+212600008100", role="vet")
    vet_user_id = (await client.get("/api/v1/auth/me", headers=vet)).json()["id"]
    form = {"clinic_name": "Atlas Vet", "specialization": "Large animals", "region": "Marrakech-Safi", "province": "Marrakech", "phone": "+212600008100"}
    application = await client.post("/api/v1/vets/apply", headers=vet, data=form, files={"document": ("license.pdf", b"%PDF-1.4\nlicense\n", "application/pdf")})
    assert application.status_code == 201, application.text
    vet_id = application.json()["id"]
    admin, _ = await make_admin(db_session, client, auth_headers, "+212600008101")
    assert (await client.patch(f"/api/v1/admin/vets/{vet_id}/approve", headers=admin)).status_code == 200
    assert (await client.get(f"/api/v1/vets/{vet_id}")).status_code == 200
    assert (await client.get("/api/v1/admin/stats", headers=admin)).json()["approved_vets"] == 1
    assert (await client.patch(f"/api/v1/admin/users/{vet_user_id}/suspend", headers=admin, json={"reason": "Professional account investigation"})).status_code == 200
    assert (await client.get(f"/api/v1/vets/{vet_id}")).status_code == 404
    assert (await client.get("/api/v1/admin/stats", headers=admin)).json()["approved_vets"] == 0
    assert (await client.patch(f"/api/v1/admin/users/{vet_user_id}/activate", headers=admin)).status_code == 200
    assert (await client.get(f"/api/v1/vets/{vet_id}")).status_code == 200
    assert (await client.get("/api/v1/admin/stats", headers=admin)).json()["approved_vets"] == 1

