from app.core.exceptions import forbidden
from app.modules.users.models import User, UserRole


def require_role(user: User, *allowed_roles: UserRole) -> None:
    if user.role not in allowed_roles:
        allowed = ", ".join(role.value for role in allowed_roles)
        raise forbidden(f"Requires one of these roles: {allowed}")


def require_farmer(user: User) -> None:
    require_role(user, UserRole.FARMER)


def require_admin(user: User) -> None:
    require_role(user, UserRole.ADMIN)


def ensure_user_owns_profile(user: User, profile_user_id: object) -> None:
    if user.id != profile_user_id:
        raise forbidden("Cannot access another user's farmer profile")
