"""add admin moderation audit and report review metadata
Revision ID: 20260713_0005
Revises: 20260713_0004
Create Date: 2026-07-13 15:00:00.000000
"""
from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa
revision: str = "20260713_0005"
down_revision: str | None = "20260713_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    op.add_column("listing_reports", sa.Column("reviewed_by_admin_id", sa.Uuid(), nullable=True))
    op.add_column("listing_reports", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("listing_reports", sa.Column("admin_note", sa.String(1000), nullable=True))
    op.create_foreign_key(op.f("fk_listing_reports_reviewed_by_admin_id_users"), "listing_reports", "users", ["reviewed_by_admin_id"], ["id"], ondelete="SET NULL")
    op.create_index(op.f("ix_listing_reports_reviewed_by_admin_id"), "listing_reports", ["reviewed_by_admin_id"])
    op.create_table("admin_audit_logs",
        sa.Column("id", sa.Uuid(), nullable=False), sa.Column("admin_user_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(80), nullable=False), sa.Column("target_type", sa.String(40), nullable=False),
        sa.Column("target_id", sa.Uuid(), nullable=True), sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["admin_user_id"], ["users.id"], name=op.f("fk_admin_audit_logs_admin_user_id_users"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admin_audit_logs")))
    op.create_index(op.f("ix_admin_audit_logs_admin_user_id"), "admin_audit_logs", ["admin_user_id"])
    op.create_index(op.f("ix_admin_audit_logs_action"), "admin_audit_logs", ["action"])
    op.create_index(op.f("ix_admin_audit_logs_created_at"), "admin_audit_logs", ["created_at"])
    op.create_index("ix_admin_audit_logs_target", "admin_audit_logs", ["target_type", "target_id"])

def downgrade() -> None:
    op.drop_index("ix_admin_audit_logs_target", table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_created_at"), table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_action"), table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_admin_user_id"), table_name="admin_audit_logs")
    op.drop_table("admin_audit_logs")
    op.drop_index(op.f("ix_listing_reports_reviewed_by_admin_id"), table_name="listing_reports")
    op.drop_constraint(op.f("fk_listing_reports_reviewed_by_admin_id_users"), "listing_reports", type_="foreignkey")
    op.drop_column("listing_reports", "admin_note"); op.drop_column("listing_reports", "reviewed_at"); op.drop_column("listing_reports", "reviewed_by_admin_id")