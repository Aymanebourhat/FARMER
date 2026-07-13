"""create marketplace tables

Revision ID: 20260711_0003
Revises: 20260710_0002
Create Date: 2026-07-11 12:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260711_0003"
down_revision: str | None = "20260710_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

listing_status = sa.Enum("draft", "active", "expired", "sold", "suspended", name="listing_status")
listing_report_reason = sa.Enum("fake", "scam", "wrong_price", "sold", "abusive", "other", name="listing_report_reason")
listing_report_status = sa.Enum("pending", "reviewed", "dismissed", "action_taken", name="listing_report_status")


def upgrade() -> None:
    op.create_table(
        "marketplace_listings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("animal_id", sa.Uuid(), nullable=False),
        sa.Column("farmer_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_mad", sa.Numeric(12, 2), nullable=False),
        sa.Column("region", sa.String(120), nullable=False),
        sa.Column("province", sa.String(120), nullable=False),
        sa.Column("contact_phone", sa.String(32), nullable=False),
        sa.Column("contact_whatsapp", sa.String(32), nullable=True),
        sa.Column("status", listing_status, nullable=False, server_default="active"),
        sa.Column("trust_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("price_mad > 0", name=op.f("ck_marketplace_listings_price_mad_positive")),
        sa.CheckConstraint("trust_score >= 0 AND trust_score <= 100", name=op.f("ck_marketplace_listings_trust_score_range")),
        sa.ForeignKeyConstraint(["animal_id"], ["animals.id"], name=op.f("fk_marketplace_listings_animal_id_animals"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["farmer_id"], ["farmer_profiles.id"], name=op.f("fk_marketplace_listings_farmer_id_farmer_profiles"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_marketplace_listings")),
    )
    op.create_index(op.f("ix_marketplace_listings_animal_id"), "marketplace_listings", ["animal_id"])
    op.create_index(op.f("ix_marketplace_listings_farmer_id"), "marketplace_listings", ["farmer_id"])
    op.create_index(op.f("ix_marketplace_listings_price_mad"), "marketplace_listings", ["price_mad"])
    op.create_index(op.f("ix_marketplace_listings_expires_at"), "marketplace_listings", ["expires_at"])
    op.create_index("ix_marketplace_listings_status_created_at", "marketplace_listings", ["status", "created_at"])
    op.create_index("ix_marketplace_listings_region_province", "marketplace_listings", ["region", "province"])
    op.create_index("uq_marketplace_listings_one_active_per_animal", "marketplace_listings", ["animal_id"], unique=True, postgresql_where=sa.text("status = 'active'"))

    op.create_table(
        "listing_reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("listing_id", sa.Uuid(), nullable=False),
        sa.Column("reporter_user_id", sa.Uuid(), nullable=True),
        sa.Column("reason", listing_report_reason, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", listing_report_status, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["listing_id"], ["marketplace_listings.id"], name=op.f("fk_listing_reports_listing_id_marketplace_listings"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reporter_user_id"], ["users.id"], name=op.f("fk_listing_reports_reporter_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_listing_reports")),
    )
    op.create_index(op.f("ix_listing_reports_listing_id"), "listing_reports", ["listing_id"])
    op.create_index(op.f("ix_listing_reports_status"), "listing_reports", ["status"])
    op.create_index(op.f("ix_listing_reports_created_at"), "listing_reports", ["created_at"])


def downgrade() -> None:
    op.drop_index(op.f("ix_listing_reports_created_at"), table_name="listing_reports")
    op.drop_index(op.f("ix_listing_reports_status"), table_name="listing_reports")
    op.drop_index(op.f("ix_listing_reports_listing_id"), table_name="listing_reports")
    op.drop_table("listing_reports")
    op.drop_index("uq_marketplace_listings_one_active_per_animal", table_name="marketplace_listings")
    op.drop_index("ix_marketplace_listings_region_province", table_name="marketplace_listings")
    op.drop_index("ix_marketplace_listings_status_created_at", table_name="marketplace_listings")
    op.drop_index(op.f("ix_marketplace_listings_expires_at"), table_name="marketplace_listings")
    op.drop_index(op.f("ix_marketplace_listings_price_mad"), table_name="marketplace_listings")
    op.drop_index(op.f("ix_marketplace_listings_farmer_id"), table_name="marketplace_listings")
    op.drop_index(op.f("ix_marketplace_listings_animal_id"), table_name="marketplace_listings")
    op.drop_table("marketplace_listings")
    listing_report_status.drop(op.get_bind(), checkfirst=False)
    listing_report_reason.drop(op.get_bind(), checkfirst=False)
    listing_status.drop(op.get_bind(), checkfirst=False)
