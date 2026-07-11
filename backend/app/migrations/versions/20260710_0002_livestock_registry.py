"""create livestock registry tables

Revision ID: 20260710_0002
Revises: 20260708_0001
Create Date: 2026-07-10 21:30:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260710_0002"
down_revision: str | None = "20260708_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

species = sa.Enum("sheep", "cow", "goat", "camel", "other", name="species")
animal_sex = sa.Enum("male", "female", "unknown", name="animal_sex")
animal_health_status = sa.Enum("healthy", "sick", "recovering", "unknown", name="animal_health_status")
animal_ownership_status = sa.Enum("owned", "listed", "reserved", "sold", "dead", name="animal_ownership_status")
sale_readiness = sa.Enum("not_ready", "ready", "unknown", name="sale_readiness")
verification_level = sa.Enum("self_reported", "admin_reviewed", "vet_verified", name="verification_level")
health_record_type = sa.Enum("vaccine", "illness", "treatment", "checkup", "note", name="health_record_type")
health_verification_status = sa.Enum("farmer_reported", "vet_verified", name="health_verification_status")


def upgrade() -> None:
    op.create_table(
        "animals",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("farmer_id", sa.Uuid(), nullable=False),
        sa.Column("species", species, nullable=False),
        sa.Column("breed", sa.String(120), nullable=True),
        sa.Column("sex", animal_sex, nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("estimated_age_months", sa.Integer(), nullable=True),
        sa.Column("color", sa.String(120), nullable=True),
        sa.Column("identification_notes", sa.Text(), nullable=True),
        sa.Column("health_status", animal_health_status, nullable=False),
        sa.Column("ownership_status", animal_ownership_status, nullable=False, server_default="owned"),
        sa.Column("sale_readiness", sale_readiness, nullable=False),
        sa.Column("verification_level", verification_level, nullable=False, server_default="self_reported"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("birth_date IS NOT NULL OR estimated_age_months IS NOT NULL", name=op.f("ck_animals_age_required")),
        sa.CheckConstraint("estimated_age_months IS NULL OR estimated_age_months > 0", name=op.f("ck_animals_estimated_age_months_positive")),
        sa.ForeignKeyConstraint(["farmer_id"], ["farmer_profiles.id"], name=op.f("fk_animals_farmer_id_farmer_profiles"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_animals")),
    )
    op.create_index(op.f("ix_animals_farmer_id"), "animals", ["farmer_id"])
    op.create_index(op.f("ix_animals_created_at"), "animals", ["created_at"])
    op.create_index("ix_animals_farmer_id_species", "animals", ["farmer_id", "species"])
    op.create_index("ix_animals_species_ownership_status", "animals", ["species", "ownership_status"])

    op.create_table(
        "animal_photos",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("animal_id", sa.Uuid(), nullable=False),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("file_key", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.String(50), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("size_bytes > 0 AND size_bytes <= 5242880", name=op.f("ck_animal_photos_size_valid")),
        sa.CheckConstraint("mime_type IN ('image/jpeg', 'image/png', 'image/webp')", name=op.f("ck_animal_photos_mime_type_allowed")),
        sa.ForeignKeyConstraint(["animal_id"], ["animals.id"], name=op.f("fk_animal_photos_animal_id_animals"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_animal_photos")),
        sa.UniqueConstraint("file_key", name=op.f("uq_animal_photos_file_key")),
    )
    op.create_index(op.f("ix_animal_photos_animal_id"), "animal_photos", ["animal_id"])
    op.create_index("ix_animal_photos_animal_id_uploaded_at", "animal_photos", ["animal_id", "uploaded_at"])
    op.create_index("uq_animal_photos_one_primary", "animal_photos", ["animal_id"], unique=True, postgresql_where=sa.text("is_primary IS true"))

    op.create_table(
        "weight_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("animal_id", sa.Uuid(), nullable=False),
        sa.Column("weight_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("recorded_at", sa.Date(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("weight_kg > 0", name=op.f("ck_weight_records_weight_kg_positive")),
        sa.ForeignKeyConstraint(["animal_id"], ["animals.id"], name=op.f("fk_weight_records_animal_id_animals"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_weight_records")),
        sa.UniqueConstraint("animal_id", "recorded_at", name="uq_weight_records_animal_recorded_at"),
    )
    op.create_index(op.f("ix_weight_records_animal_id"), "weight_records", ["animal_id"])

    op.create_table(
        "health_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("animal_id", sa.Uuid(), nullable=False),
        sa.Column("record_type", health_record_type, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("medicine_name", sa.String(255), nullable=True),
        sa.Column("vet_id", sa.Uuid(), nullable=True),
        sa.Column("verification_status", health_verification_status, nullable=False, server_default="farmer_reported"),
        sa.Column("recorded_at", sa.Date(), nullable=False),
        sa.Column("next_reminder_at", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["animal_id"], ["animals.id"], name=op.f("fk_health_records_animal_id_animals"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_health_records")),
    )
    op.create_index(op.f("ix_health_records_animal_id"), "health_records", ["animal_id"])
    op.create_index("ix_health_records_animal_id_recorded_at", "health_records", ["animal_id", "recorded_at"])
    op.create_index("ix_health_records_next_reminder_at", "health_records", ["next_reminder_at"])


def downgrade() -> None:
    op.drop_index("ix_health_records_next_reminder_at", table_name="health_records")
    op.drop_index("ix_health_records_animal_id_recorded_at", table_name="health_records")
    op.drop_index(op.f("ix_health_records_animal_id"), table_name="health_records")
    op.drop_table("health_records")
    op.drop_index(op.f("ix_weight_records_animal_id"), table_name="weight_records")
    op.drop_table("weight_records")
    op.drop_index("uq_animal_photos_one_primary", table_name="animal_photos")
    op.drop_index("ix_animal_photos_animal_id_uploaded_at", table_name="animal_photos")
    op.drop_index(op.f("ix_animal_photos_animal_id"), table_name="animal_photos")
    op.drop_table("animal_photos")
    op.drop_index("ix_animals_species_ownership_status", table_name="animals")
    op.drop_index("ix_animals_farmer_id_species", table_name="animals")
    op.drop_index(op.f("ix_animals_created_at"), table_name="animals")
    op.drop_index(op.f("ix_animals_farmer_id"), table_name="animals")
    op.drop_table("animals")
    health_verification_status.drop(op.get_bind(), checkfirst=False)
    health_record_type.drop(op.get_bind(), checkfirst=False)
    verification_level.drop(op.get_bind(), checkfirst=False)
    sale_readiness.drop(op.get_bind(), checkfirst=False)
    animal_ownership_status.drop(op.get_bind(), checkfirst=False)
    animal_health_status.drop(op.get_bind(), checkfirst=False)
    animal_sex.drop(op.get_bind(), checkfirst=False)
    species.drop(op.get_bind(), checkfirst=False)
