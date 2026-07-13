from uuid import UUID

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User, UserRole, UserStatus
from app.modules.vets.models import VetProfile

PDF = b"%PDF-1.4\nvet verification\n"
FORM = {"clinic_name": "Atlas Vet", "specialization": "Large animals", "region": "Marrakech-Safi", "province": "Marrakech", "phone": "+212600000777", "whatsapp": "+212600000777"}

async def apply(client: AsyncClient, headers, **fields):
    return await client.post("/api/v1/vets/apply", headers=headers, data={**FORM, **fields}, files={"document": ("../../unsafe.pdf", PDF, "application/pdf")})

async def make_admin(db: AsyncSession, client: AsyncClient, auth_headers):
    headers = await auth_headers(phone="+212600009001", role="vet")
    user = (await db.execute(select(User).where(User.phone == "+212600009001"))).scalar_one()
    user.role = UserRole.ADMIN
    await db.commit()
    return headers

async def test_vet_application_permissions_validation_and_self_view(client: AsyncClient, db_session: AsyncSession, auth_headers) -> None:
    assert (await client.post("/api/v1/vets/apply", data=FORM, files={"document": ("a.pdf", PDF, "application/pdf")})).status_code == 401
    farmer = await auth_headers(phone="+212600009002")
    assert (await apply(client, farmer)).status_code == 403
    admin = await make_admin(db_session, client, auth_headers)
    assert (await apply(client, admin)).status_code == 403
    vet = await auth_headers(phone="+212600009003", role="vet")
    response = await apply(client, vet)
    assert response.status_code == 201, response.text
    body = response.json(); assert body["verification_status"] == "pending" and body["has_document"] is True
    assert "license_document_key" not in response.text
    assert (await apply(client, vet)).status_code == 409
    assert (await client.get("/api/v1/vets/me", headers=vet)).status_code == 200
    assert (await client.patch("/api/v1/vets/me", headers=vet, json={"verification_status": "approved"})).status_code == 422

async def test_document_security_and_admin_lifecycle(client: AsyncClient, db_session: AsyncSession, auth_headers) -> None:
    vet = await auth_headers(phone="+212600009004", role="vet")
    created = (await apply(client, vet)).json(); vet_id = created["id"]
    admin = await make_admin(db_session, client, auth_headers)
    assert (await client.get(f"/api/v1/vets/{vet_id}")).status_code == 404
    assert (await client.get(f"/api/v1/admin/vets/{vet_id}/document", headers=vet)).status_code == 403
    doc = await client.get(f"/api/v1/admin/vets/{vet_id}/document", headers=admin)
    assert doc.status_code == 200 and doc.content == PDF and "attachment" in doc.headers["content-disposition"]
    approved = await client.patch(f"/api/v1/admin/vets/{vet_id}/approve", headers=admin)
    assert approved.status_code == 200 and approved.json()["verification_status"] == "approved" and approved.json()["verified_at"]
    public = await client.get(f"/api/v1/vets/{vet_id}")
    assert public.status_code == 200 and "document" not in public.text and "rejection_reason" not in public.text
    changed = await client.post("/api/v1/vets/me/document", headers=vet, files={"document": ("new.png", b"not png", "image/png")})
    assert changed.status_code == 422
    changed = await client.post("/api/v1/vets/me/document", headers=vet, files={"document": ("new.pdf", PDF, "application/pdf")})
    assert changed.status_code == 200 and changed.json()["verification_status"] == "pending"
    assert (await client.get(f"/api/v1/vets/{vet_id}")).status_code == 404

async def test_public_filters_rejection_and_resubmission(client: AsyncClient, db_session: AsyncSession, auth_headers) -> None:
    vet = await auth_headers(phone="+212600009005", role="vet")
    profile = (await apply(client, vet)).json(); admin = await make_admin(db_session, client, auth_headers)
    rejected = await client.patch(f"/api/v1/admin/vets/{profile['id']}/reject", headers=admin, json={"reason": "Document is unreadable"})
    assert rejected.status_code == 200 and rejected.json()["verification_status"] == "rejected"
    assert (await client.get("/api/v1/vets/me", headers=vet)).json()["rejection_reason"] == "Document is unreadable"
    resubmitted = await apply(client, vet, specialization="Sheep care")
    assert resubmitted.status_code == 201 and resubmitted.json()["verification_status"] == "pending"
    assert (await client.patch(f"/api/v1/admin/vets/{profile['id']}/approve", headers=admin)).status_code == 200
    listing = await client.get("/api/v1/vets", params={"region": "Marrakech-Safi", "province": "Marrakech", "specialization": "sheep"})
    assert listing.status_code == 200 and listing.json()["total"] == 1
    assert (await client.get("/api/v1/vets", params={"region": "Marrakech-Safi", "province": "Casablanca"})).status_code == 422

async def test_document_mime_and_public_suspension(client: AsyncClient, db_session: AsyncSession, auth_headers) -> None:
    vet = await auth_headers(phone="+212600009006", role="vet")
    assert (await client.post("/api/v1/vets/apply", headers=vet, data=FORM, files={"document": ("bad.exe", b"MZ", "application/octet-stream")})).status_code == 422
    assert (await client.post("/api/v1/vets/apply", headers=vet, data=FORM, files={"document": ("spoof.pdf", b"not-pdf", "application/pdf")})).status_code == 422
    profile=(await apply(client,vet)).json(); admin=await make_admin(db_session,client,auth_headers); assert (await client.patch(f"/api/v1/admin/vets/{profile['id']}/approve",headers=admin)).status_code==200
    user=(await db_session.execute(select(User).where(User.phone=="+212600009006"))).scalar_one(); user.status=UserStatus.SUSPENDED; await db_session.commit()
    assert (await client.get(f"/api/v1/vets/{profile['id']}")).status_code == 404
