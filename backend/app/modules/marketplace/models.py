import enum
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, Integer, Numeric, String, Text, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.users.models import enum_values


class ListingStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    SOLD = "sold"
    SUSPENDED = "suspended"


class ReportReason(str, enum.Enum):
    FAKE = "fake"
    SCAM = "scam"
    WRONG_PRICE = "wrong_price"
    SOLD = "sold"
    ABUSIVE = "abusive"
    OTHER = "other"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
    ACTION_TAKEN = "action_taken"


class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"
    __table_args__ = (
        CheckConstraint("price_mad > 0", name="price_mad_positive"),
        CheckConstraint("trust_score >= 0 AND trust_score <= 100", name="trust_score_range"),
        Index("ix_marketplace_listings_status_created_at", "status", "created_at"),
        Index("ix_marketplace_listings_region_province", "region", "province"),
        Index("uq_marketplace_listings_one_active_per_animal", "animal_id", unique=True, postgresql_where=text("status = 'active'"), sqlite_where=text("status = 'active'")),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    animal_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("animals.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("farmer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_mad: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    region: Mapped[str] = mapped_column(String(120), nullable=False)
    province: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    contact_whatsapp: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[ListingStatus] = mapped_column(Enum(ListingStatus, values_callable=enum_values, name="listing_status"), nullable=False, default=ListingStatus.ACTIVE)
    trust_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    animal = relationship("Animal")
    farmer = relationship("FarmerProfile")
    reports: Mapped[list["ListingReport"]] = relationship(back_populates="listing", cascade="all, delete-orphan")


class ListingReport(Base):
    __tablename__ = "listing_reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("marketplace_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason: Mapped[ReportReason] = mapped_column(Enum(ReportReason, values_callable=enum_values, name="listing_report_reason"), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus, values_callable=enum_values, name="listing_report_status"), nullable=False, default=ReportStatus.PENDING, index=True)
    reviewed_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    admin_note: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC), index=True)

    listing: Mapped[MarketplaceListing] = relationship(back_populates="reports")
    reporter = relationship("User", foreign_keys=[reporter_user_id])
    reviewing_admin = relationship("User", foreign_keys=[reviewed_by_admin_id])
