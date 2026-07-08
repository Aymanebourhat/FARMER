import argparse
import asyncio
import getpass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.users.models import Language, User, UserRole
from app.modules.users.repository import create_user, get_user_by_phone


async def create_admin_user(
    session: AsyncSession,
    *,
    full_name: str,
    phone: str,
    password: str,
    preferred_language: Language = Language.FR,
    email: str | None = None,
) -> User:
    existing = await get_user_by_phone(session, phone)
    if existing is not None:
        raise ValueError("A user with this phone already exists")

    user = await create_user(
        session,
        full_name=full_name.strip(),
        phone=phone.strip(),
        email=email.strip() if email else None,
        password_hash=hash_password(password),
        role=UserRole.ADMIN,
        preferred_language=preferred_language,
    )
    await session.commit()
    await session.refresh(user)
    return user


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create a script-only admin user.")
    parser.add_argument("--full-name", required=True)
    parser.add_argument("--phone", required=True)
    parser.add_argument("--email", default=None)
    parser.add_argument("--preferred-language", choices=[Language.AR.value, Language.FR.value], default="fr")
    parser.add_argument("--password", default=None)
    return parser


async def main_async() -> None:
    args = build_parser().parse_args()
    password = args.password or getpass.getpass("Admin password: ")
    async with AsyncSessionLocal() as session:
        user = await create_admin_user(
            session,
            full_name=args.full_name,
            phone=args.phone,
            email=args.email,
            password=password,
            preferred_language=Language(args.preferred_language),
        )
    print(f"Created admin user {user.id} for phone {user.phone}")


def main() -> None:
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
