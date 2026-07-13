"""create vet profiles

Revision ID: 20260713_0004
Revises: 20260711_0003
Create Date: 2026-07-13 12:00:00.000000
"""
from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa

revision: str = "20260713_0004"
down_revision: str | None = "20260711_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

vet_verification_status = sa.Enum("pending", "approved", "rejected", name="vet_verification_status")

def upgrade() -> None:
    op.create_table("vet_profiles",
        sa.Column("id", sa.Uuid(), nullable=False), sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("clinic_name", sa.String(255), nullable=True), sa.Column("specialization", sa.String(255), nullable=True),
        sa.Column("region", sa.String(120), nullable=False), sa.Column("province", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False), sa.Column("whatsapp", sa.String(32), nullable=True),
        sa.Column("license_document_key", sa.String(500), nullable=True), sa.Column("license_document_mime_type", sa.String(100), nullable=True), sa.Column("license_document_size_bytes", sa.Integer(), nullable=True),
        sa.Column("verification_status", vet_verification_status, nullable=False, server_default="pending"), sa.Column("rejection_reason", sa.Text(), nullable=True), sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_vet_profiles_user_id_users"), ondelete="CASCADE"), sa.PrimaryKeyConstraint("id", name=op.f("pk_vet_profiles")), sa.UniqueConstraint("user_id", name=op.f("uq_vet_profiles_user_id")),
    )
    op.create_index(op.f("ix_vet_profiles_user_id"), "vet_profiles", ["user_id"])
    op.create_index(op.f("ix_vet_profiles_verification_status"), "vet_profiles", ["verification_status"])
    op.create_index("ix_vet_profiles_region_province", "vet_profiles", ["region", "province"])
    op.create_index("ix_vet_profiles_created_at", "vet_profiles", ["created_at"])

def downgrade() -> None:
    op.drop_index("ix_vet_profiles_created_at", table_name="vet_profiles")
    op.drop_index("ix_vet_profiles_region_province", table_name="vet_profiles")
    op.drop_index(op.f("ix_vet_profiles_verification_status"), table_name="vet_profiles")
    op.drop_index(op.f("ix_vet_profiles_user_id"), table_name="vet_profiles")
    op.drop_table("vet_profiles")
    vet_verification_status.drop(op.get_bind(), checkfirst=False)
