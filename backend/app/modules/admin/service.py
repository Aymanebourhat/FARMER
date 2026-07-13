from datetime import UTC, datetime
from math import ceil
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import not_found
from app.core.permissions import require_admin
from app.modules.admin import repository
from app.modules.admin.schemas import *
from app.modules.animals.models import Animal, AnimalOwnershipStatus
from app.modules.farmers.models import FarmerProfile
from app.modules.marketplace.models import ListingReport, ListingStatus, MarketplaceListing, ReportStatus
from app.modules.users.models import User, UserRole, UserStatus
from app.modules.vets.models import VetProfile, VetVerificationStatus

def conflict(detail:str): raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail=detail)
def pages(total:int,size:int): return ceil(total/size) if total else 0
def user_summary(u:User): return AdminUserSummary.model_validate(u,from_attributes=True)
def safe_admin(u:User): return SafeAdmin(id=u.id,full_name=u.full_name)
async def user_detail(session:AsyncSession,u:User):
    farmer=None;vet=None
    if u.farmer_profile:
        ac,lc=await repository.farmer_counts(session,u.farmer_profile.id,datetime.now(UTC));p=u.farmer_profile
        farmer=FarmerSummary(id=p.id,farm_name=p.farm_name,region=p.region,province=p.province,animal_count=ac,active_listing_count=lc)
    if u.vet_profile:
        p=u.vet_profile;vet=VetSummary(id=p.id,clinic_name=p.clinic_name,specialization=p.specialization,region=p.region,province=p.province,verification_status=p.verification_status)
    return AdminUserDetail(**user_summary(u).model_dump(),farmer_profile=farmer,vet_profile=vet)
async def users(session:AsyncSession,admin:User,f):
    require_admin(admin);rows,total=await repository.list_users(session,f);return PaginatedUsers(items=[user_summary(x) for x in rows],page=f.page,page_size=f.page_size,total=total,pages=pages(total,f.page_size))
async def get_user(session:AsyncSession,admin:User,user_id:UUID):
    require_admin(admin);u=await repository.get_user(session,user_id)
    if not u:raise not_found("User not found")
    return await user_detail(session,u)
async def suspend_user(session:AsyncSession,admin:User,user_id:UUID,reason:str):
    require_admin(admin);u=await repository.get_user(session,user_id)
    if not u:raise not_found("User not found")
    if u.id==admin.id:conflict("Admins cannot suspend themselves")
    if u.role==UserRole.ADMIN:conflict("Admin accounts cannot be suspended here")
    if u.status==UserStatus.SUSPENDED:conflict("User is already suspended")
    u.status=UserStatus.SUSPENDED;await repository.add_audit(session,admin_id=admin.id,action="user.suspended",target_type="user",target_id=u.id,metadata={"reason":reason});await session.commit();return await user_detail(session,u)
async def activate_user(session:AsyncSession,admin:User,user_id:UUID):
    require_admin(admin);u=await repository.get_user(session,user_id)
    if not u:raise not_found("User not found")
    if u.role==UserRole.ADMIN:conflict("Admin accounts cannot be changed here")
    if u.status!=UserStatus.SUSPENDED:conflict("User is not suspended")
    u.status=UserStatus.ACTIVE;await repository.add_audit(session,admin_id=admin.id,action="user.activated",target_type="user",target_id=u.id,metadata={});await session.commit();return await user_detail(session,u)

def admin_animal(a:Animal): return AdminAnimal(id=a.id,species=a.species,breed=a.breed,sex=a.sex,ownership_status=a.ownership_status,sale_readiness=a.sale_readiness,photos=[p.file_url for p in a.photos])
def admin_farmer(l:MarketplaceListing):
    u=l.farmer.user;return AdminFarmer(id=l.farmer.id,user_id=u.id,full_name=u.full_name,phone=u.phone,status=u.status)
async def listing_summary(session:AsyncSession,l:MarketplaceListing):
    rc,pc=await repository.listing_report_counts(session,l.id)
    return AdminListingSummary(id=l.id,title=l.title,price_mad=l.price_mad,region=l.region,province=l.province,status=l.status,expires_at=l.expires_at,created_at=l.created_at,updated_at=l.updated_at,animal=admin_animal(l.animal),farmer=admin_farmer(l),report_count=rc,pending_report_count=pc)
async def listing_detail(session:AsyncSession,l:MarketplaceListing):
    s=await listing_summary(session,l);reports=[AdminReportInline(id=r.id,reason=r.reason,status=r.status,description=r.description,created_at=r.created_at) for r in l.reports]
    return AdminListingDetail(**s.model_dump(),description=l.description,contact_phone=l.contact_phone,contact_whatsapp=l.contact_whatsapp,trust_score=l.trust_score,reports=reports)
async def listings(session:AsyncSession,admin:User,f):
    require_admin(admin);rows,total=await repository.list_listings(session,f);items=[await listing_summary(session,x) for x in rows];return PaginatedListings(items=items,page=f.page,page_size=f.page_size,total=total,pages=pages(total,f.page_size))
async def get_listing(session:AsyncSession,admin:User,listing_id:UUID):
    require_admin(admin);l=await repository.get_listing(session,listing_id)
    if not l:raise not_found("Listing not found")
    return await listing_detail(session,l)
async def suspend_listing(session:AsyncSession,admin:User,listing_id:UUID,reason:str,*,commit=True):
    require_admin(admin);l=await repository.get_listing(session,listing_id)
    if not l:raise not_found("Listing not found")
    if l.status==ListingStatus.SUSPENDED:conflict("Listing is already suspended")
    if l.status in {ListingStatus.SOLD,ListingStatus.EXPIRED}:conflict("Listing cannot be suspended in its current state")
    l.status=ListingStatus.SUSPENDED;l.animal.ownership_status=AnimalOwnershipStatus.LISTED
    await repository.add_audit(session,admin_id=admin.id,action="listing.suspended",target_type="listing",target_id=l.id,metadata={"reason":reason})
    if commit:await session.commit()
    return await listing_detail(session,l)
async def restore_listing(session:AsyncSession,admin:User,listing_id:UUID):
    require_admin(admin);l=await repository.get_listing(session,listing_id)
    if not l:raise not_found("Listing not found")
    if l.status!=ListingStatus.SUSPENDED:conflict("Listing is not suspended")
    if l.animal.deleted_at or l.animal.ownership_status in {AnimalOwnershipStatus.DEAD,AnimalOwnershipStatus.SOLD}:conflict("Linked animal is not eligible")
    if l.farmer.user.status!=UserStatus.ACTIVE:conflict("Farmer account is not active")
    duplicate=int((await session.execute(select(func.count(MarketplaceListing.id)).where(MarketplaceListing.animal_id==l.animal_id,MarketplaceListing.status==ListingStatus.ACTIVE,MarketplaceListing.id!=l.id))).scalar_one())
    if duplicate:conflict("Another active listing exists for this animal")
    expiry = l.expires_at if l.expires_at.tzinfo else l.expires_at.replace(tzinfo=UTC)
    l.status=ListingStatus.EXPIRED if expiry<=datetime.now(UTC) else ListingStatus.ACTIVE;l.animal.ownership_status=AnimalOwnershipStatus.LISTED
    await repository.add_audit(session,admin_id=admin.id,action="listing.restored",target_type="listing",target_id=l.id,metadata={"result_status":l.status.value});await session.commit();return await listing_detail(session,l)
def reporter(r:ListingReport): return ReporterSummary(type="user" if r.reporter else "guest",id=r.reporter.id if r.reporter else None,full_name=r.reporter.full_name if r.reporter else None)
def report_listing(r:ListingReport): return ReportListingSummary(id=r.listing.id,title=r.listing.title,status=r.listing.status,farmer=admin_farmer(r.listing))
def report_summary(r:ListingReport): return AdminReportSummary(id=r.id,reason=r.reason,description=r.description,status=r.status,reporter=reporter(r),listing=report_listing(r),created_at=r.created_at,reviewed_at=r.reviewed_at,reviewing_admin=safe_admin(r.reviewing_admin) if r.reviewing_admin else None,admin_note=r.admin_note)
async def reports(session:AsyncSession,admin:User,f):
    require_admin(admin);rows,total=await repository.list_reports(session,f);return PaginatedReports(items=[report_summary(x) for x in rows],page=f.page,page_size=f.page_size,total=total,pages=pages(total,f.page_size))
async def get_report(session:AsyncSession,admin:User,report_id:UUID):
    require_admin(admin);r=await repository.get_report(session,report_id)
    if not r:raise not_found("Report not found")
    return AdminReportDetail(**report_summary(r).model_dump(),other_report_count=await repository.count_other_reports(session,r))
async def dismiss_report(session:AsyncSession,admin:User,report_id:UUID,note:str):
    require_admin(admin);r=await repository.get_report(session,report_id)
    if not r:raise not_found("Report not found")
    if r.status not in {ReportStatus.PENDING,ReportStatus.REVIEWED}:conflict("Report has already been resolved")
    r.status=ReportStatus.DISMISSED;r.reviewed_by_admin_id=admin.id;r.reviewed_at=datetime.now(UTC);r.admin_note=note
    await repository.add_audit(session,admin_id=admin.id,action="report.dismissed",target_type="report",target_id=r.id,metadata={"note":note});await session.commit();r=await repository.get_report(session,r.id);return AdminReportDetail(**report_summary(r).model_dump(),other_report_count=await repository.count_other_reports(session,r))
async def resolve_report(session:AsyncSession,admin:User,report_id:UUID,action:str,note:str):
    require_admin(admin);r=await repository.get_report(session,report_id)
    if not r:raise not_found("Report not found")
    if r.status not in {ReportStatus.PENDING,ReportStatus.REVIEWED}:conflict("Report has already been resolved")
    if action=="suspend_listing":
        if r.listing.status!=ListingStatus.SUSPENDED: await suspend_listing(session,admin,r.listing_id,note,commit=False)
        r.status=ReportStatus.ACTION_TAKEN
    elif action=="suspend_farmer":
        u=r.listing.farmer.user
        if u.status!=UserStatus.SUSPENDED:
            u.status=UserStatus.SUSPENDED;await repository.add_audit(session,admin_id=admin.id,action="user.suspended",target_type="user",target_id=u.id,metadata={"reason":note,"source_report_id":str(r.id)})
        r.status=ReportStatus.ACTION_TAKEN
    else:r.status=ReportStatus.DISMISSED
    r.reviewed_by_admin_id=admin.id;r.reviewed_at=datetime.now(UTC);r.admin_note=note
    await repository.add_audit(session,admin_id=admin.id,action="report.resolved",target_type="report",target_id=r.id,metadata={"action":action,"note":note});await session.commit();r=await repository.get_report(session,r.id);return AdminReportDetail(**report_summary(r).model_dump(),other_report_count=await repository.count_other_reports(session,r))
async def audit_logs(session:AsyncSession,admin:User,f):
    require_admin(admin);rows,total=await repository.list_audits(session,f);items=[AdminAuditLogResponse(id=x.id,admin=safe_admin(x.admin),action=x.action,target_type=x.target_type,target_id=x.target_id,metadata_json=x.metadata_json,created_at=x.created_at) for x in rows];return PaginatedAuditLogs(items=items,page=f.page,page_size=f.page_size,total=total,pages=pages(total,f.page_size))
async def stats(session:AsyncSession,admin:User):
    require_admin(admin);now=datetime.now(UTC)
    visible_user = User.status != UserStatus.DELETED
    total_users=await repository.scalar_count(session,User,visible_user);active_users=await repository.scalar_count(session,User,User.status==UserStatus.ACTIVE);suspended_users=await repository.scalar_count(session,User,User.status==UserStatus.SUSPENDED)
    total_farmers=await repository.scalar_count(session,User,(User.role==UserRole.FARMER)&visible_user);total_vets=await repository.scalar_count(session,User,(User.role==UserRole.VET)&visible_user)
    approved_q=select(func.count(VetProfile.id)).join(User,VetProfile.user_id==User.id).where(VetProfile.verification_status==VetVerificationStatus.APPROVED,User.status==UserStatus.ACTIVE)
    pending_q=select(func.count(VetProfile.id)).join(User,VetProfile.user_id==User.id).where(VetProfile.verification_status==VetVerificationStatus.PENDING,User.status==UserStatus.ACTIVE)
    approved=int((await session.execute(approved_q)).scalar_one());pending_vets=int((await session.execute(pending_q)).scalar_one())
    animals=await repository.scalar_count(session,Animal,Animal.deleted_at.is_(None))
    active_q=select(func.count(MarketplaceListing.id)).select_from(MarketplaceListing).join(FarmerProfile,MarketplaceListing.farmer_id==FarmerProfile.id).join(User,FarmerProfile.user_id==User.id).join(Animal,MarketplaceListing.animal_id==Animal.id).where(MarketplaceListing.status==ListingStatus.ACTIVE,MarketplaceListing.expires_at>now,User.status==UserStatus.ACTIVE,Animal.deleted_at.is_(None))
    active=int((await session.execute(active_q)).scalar_one())
    expired=await repository.scalar_count(session,MarketplaceListing,(MarketplaceListing.status==ListingStatus.EXPIRED)|((MarketplaceListing.status==ListingStatus.ACTIVE)&(MarketplaceListing.expires_at<=now)))
    sold=await repository.scalar_count(session,MarketplaceListing,MarketplaceListing.status==ListingStatus.SOLD);suspended=await repository.scalar_count(session,MarketplaceListing,MarketplaceListing.status==ListingStatus.SUSPENDED);pending_reports=await repository.scalar_count(session,ListingReport,ListingReport.status==ReportStatus.PENDING);resolved=await repository.scalar_count(session,ListingReport,ListingReport.status.in_([ReportStatus.DISMISSED,ReportStatus.ACTION_TAKEN]))
    recent=[RecentAdminAction(action=x.action,target_type=x.target_type,target_id=x.target_id,admin_name=x.admin.full_name,created_at=x.created_at) for x in await repository.recent_audits(session)]
    return AdminStats(total_users=total_users,active_users=active_users,suspended_users=suspended_users,total_farmers=total_farmers,total_vets=total_vets,approved_vets=approved,pending_vet_applications=pending_vets,total_animals=animals,active_listings=active,expired_listings=expired,sold_listings=sold,suspended_listings=suspended,pending_listing_reports=pending_reports,resolved_listing_reports=resolved,recent_admin_actions=recent)
