from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from app.scripts.create_admin import create_admin_user
from app.modules.users.models import UserRole


async def test_health_endpoint(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_farmer_can_register_login_and_fetch_me(client: AsyncClient) -> None:
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Ahmed Farmer",
            "phone": "+212600000101",
            "password": "strong-password",
            "role": "farmer",
            "preferred_language": "ar",
        },
    )

    assert register_response.status_code == 201, register_response.text
    register_body = register_response.json()
    assert register_body["token_type"] == "bearer"
    assert register_body["user"]["role"] == "farmer"
    assert register_body["user"]["phone_verified"] is False
    assert "access_token" in register_body

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"phone": "+212600000101", "password": "strong-password"},
    )

    assert login_response.status_code == 200, login_response.text
    token = login_response.json()["access_token"]

    me_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["role"] == "farmer"
    assert me_response.json()["phone_verified"] is False


async def test_vet_registration_is_allowed(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Vet User",
            "phone": "+212600000102",
            "password": "strong-password",
            "role": "vet",
            "preferred_language": "fr",
        },
    )

    assert response.status_code == 201, response.text
    assert response.json()["user"]["role"] == "vet"


async def test_public_admin_registration_is_rejected(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Admin User",
            "phone": "+212600000103",
            "password": "strong-password",
            "role": "admin",
            "preferred_language": "fr",
        },
    )

    assert response.status_code == 422


async def test_buyer_role_registration_is_rejected(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Buyer User",
            "phone": "+212600000104",
            "password": "strong-password",
            "role": "buyer",
            "preferred_language": "fr",
        },
    )

    assert response.status_code == 422


async def test_auth_me_requires_access_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401


async def test_create_admin_script_function_creates_admin_user(
    db_session: AsyncSession,
) -> None:
    user = await create_admin_user(
        db_session,
        full_name="Script Admin",
        phone="+212600000105",
        password="admin-password",
    )

    assert user.role == UserRole.ADMIN
    assert user.phone_verified is False
    assert verify_password("admin-password", user.password_hash)
