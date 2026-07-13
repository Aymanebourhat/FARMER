from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_session
from app.modules.admin import service
from app.modules.admin.schemas import *
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models import User
router=APIRouter(prefix="/admin",tags=["admin"])
@router.get("/stats",response_model=AdminStats)
async def stats(current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.stats(session,current_user)
@router.get("/users",response_model=PaginatedUsers)
async def users(filters:UserFilters=Depends(),current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.users(session,current_user,filters)
@router.get("/users/{user_id}",response_model=AdminUserDetail)
async def user(user_id:UUID,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.get_user(session,current_user,user_id)
@router.patch("/users/{user_id}/suspend",response_model=AdminUserDetail)
async def suspend_user(user_id:UUID,payload:ActionReason,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.suspend_user(session,current_user,user_id,payload.reason)
@router.patch("/users/{user_id}/activate",response_model=AdminUserDetail)
async def activate_user(user_id:UUID,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.activate_user(session,current_user,user_id)
@router.get("/listings",response_model=PaginatedListings)
async def listings(filters:ListingFilters=Depends(),current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.listings(session,current_user,filters)
@router.get("/listings/{listing_id}",response_model=AdminListingDetail)
async def listing(listing_id:UUID,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.get_listing(session,current_user,listing_id)
@router.patch("/listings/{listing_id}/suspend",response_model=AdminListingDetail)
async def suspend_listing(listing_id:UUID,payload:ActionReason,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.suspend_listing(session,current_user,listing_id,payload.reason)
@router.patch("/listings/{listing_id}/restore",response_model=AdminListingDetail)
async def restore_listing(listing_id:UUID,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.restore_listing(session,current_user,listing_id)
@router.get("/reports",response_model=PaginatedReports)
async def reports(filters:ReportFilters=Depends(),current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.reports(session,current_user,filters)
@router.get("/reports/{report_id}",response_model=AdminReportDetail)
async def report(report_id:UUID,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.get_report(session,current_user,report_id)
@router.patch("/reports/{report_id}/dismiss",response_model=AdminReportDetail)
async def dismiss(report_id:UUID,payload:AdminNote,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.dismiss_report(session,current_user,report_id,payload.note)
@router.patch("/reports/{report_id}/resolve",response_model=AdminReportDetail)
async def resolve(report_id:UUID,payload:ReportResolution,current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.resolve_report(session,current_user,report_id,payload.action,payload.note)
@router.get("/audit-logs",response_model=PaginatedAuditLogs)
async def audits(filters:AuditFilters=Depends(),current_user:User=Depends(get_current_user),session:AsyncSession=Depends(get_session)):return await service.audit_logs(session,current_user,filters)