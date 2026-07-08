"""create users and farmer profiles

Revision ID: 20260708_0001
Revises:
Create Date: 2026-07-08 00:01:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260708_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


user_role = sa.Enum("farmer", "vet", "admin", name="user_role")
user_status = sa.Enum("active", "suspended", "deleted", name="user_status")
language = sa.Enum("ar", "fr", name="language")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("phone_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("status", user_status, nullable=False, server_default="active"),
        sa.Column("preferred_language", language, nullable=False, server_default="ar"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("phone", name=op.f("uq_users_phone")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index(op.f("ix_users_phone"), "users", ["phone"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)
    op.create_index(op.f("ix_users_status"), "users", ["status"], unique=False)

    op.create_table(
        "farmer_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("farm_name", sa.String(length=255), nullable=True),
        sa.Column("region", sa.String(length=120), nullable=False),
        sa.Column("province", sa.String(length=120), nullable=False),
        sa.Column("commune", sa.String(length=120), nullable=True),
        sa.Column("main_livestock_type", sa.String(length=120), nullable=True),
        sa.Column("farm_size_label", sa.String(length=60), nullable=True),
        sa.Column("profile_completion_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "profile_completion_score >= 0 AND profile_completion_score <= 100",
            name=op.f("ck_farmer_profiles_profile_completion_score_range"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_farmer_profiles_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_farmer_profiles")),
        sa.UniqueConstraint("user_id", name=op.f("uq_farmer_profiles_user_id")),
    )
    op.create_index(
        op.f("ix_farmer_profiles_user_id"),
        "farmer_profiles",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_farmer_profiles_region_province",
        "farmer_profiles",
        ["region", "province"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_farmer_profiles_region_province", table_name="farmer_profiles")
    op.drop_index(op.f("ix_farmer_profiles_user_id"), table_name="farmer_profiles")
    op.drop_table("farmer_profiles")
    op.drop_index(op.f("ix_users_status"), table_name="users")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_phone"), table_name="users")
    op.drop_table("users")
    language.drop(op.get_bind(), checkfirst=False)
    user_status.drop(op.get_bind(), checkfirst=False)
    user_role.drop(op.get_bind(), checkfirst=False)
