from datetime import UTC, datetime
from uuid import UUID
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.modules.admin.models import AdminAuditLog
from app.modules.animals.models import Animal
from app.modules.farmers.models import FarmerProfile
from app.modules.marketplace.models import ListingReport, MarketplaceListing, ReportStatus
from app.modules.users.models import User
from app.modules.vets.models import VetProfile

async def page(session:AsyncSession, query, *, number:int, size:int):
    total=int((await session.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one())
    rows=(await session.execute(query.offset((number-1)*size).limit(size))).scalars().all()
    return list(rows),total

async def list_users(session:AsyncSession,f):
    q=select(User)
    if f.role:q=q.where(User.role==f.role)
    if f.status:q=q.where(User.status==f.status)
    if f.search:
        term=f"%{f.search.strip()}%";q=q.where(or_(User.full_name.ilike(term),User.phone.ilike(term)))
    order={"oldest":(User.created_at.asc(),User.id.asc()),"name":(User.full_name.asc(),User.id.asc())}.get(f.sort,(User.created_at.desc(),User.id.desc()))
    return await page(session,q.order_by(*order),number=f.page,size=f.page_size)
async def get_user(session:AsyncSession,user_id:UUID):
    return (await session.execute(select(User).options(selectinload(User.farmer_profile),selectinload(User.vet_profile)).where(User.id==user_id))).scalar_one_or_none()
async def farmer_counts(session:AsyncSession,profile_id:UUID,now:datetime):
    animals=int((await session.execute(select(func.count(Animal.id)).where(Animal.farmer_id==profile_id,Animal.deleted_at.is_(None)))).scalar_one())
    from app.modules.marketplace.models import ListingStatus
    listings=int((await session.execute(select(func.count(MarketplaceListing.id)).where(MarketplaceListing.farmer_id==profile_id,MarketplaceListing.status==ListingStatus.ACTIVE,MarketplaceListing.expires_at>now))).scalar_one())
    return animals,listings

report_count=select(func.count(ListingReport.id)).where(ListingReport.listing_id==MarketplaceListing.id).correlate(MarketplaceListing).scalar_subquery()
pending_count=select(func.count(ListingReport.id)).where(ListingReport.listing_id==MarketplaceListing.id,ListingReport.status==ReportStatus.PENDING).correlate(MarketplaceListing).scalar_subquery()
def listing_base():
    return select(MarketplaceListing).join(Animal).join(FarmerProfile).join(User,FarmerProfile.user_id==User.id).options(selectinload(MarketplaceListing.animal).selectinload(Animal.photos),selectinload(MarketplaceListing.farmer).selectinload(FarmerProfile.user),selectinload(MarketplaceListing.reports))
async def list_listings(session:AsyncSession,f):
    q=listing_base()
    if f.status:q=q.where(MarketplaceListing.status==f.status)
    if f.region:q=q.where(MarketplaceListing.region==f.region)
    if f.province:q=q.where(MarketplaceListing.province==f.province)
    if f.species:q=q.where(Animal.species==f.species)
    if f.farmer_id:q=q.where(MarketplaceListing.farmer_id==f.farmer_id)
    if f.has_reports is True:q=q.where(report_count>0)
    if f.has_reports is False:q=q.where(report_count==0)
    order={"oldest":(MarketplaceListing.created_at.asc(),MarketplaceListing.id.asc()),"highest_price":(MarketplaceListing.price_mad.desc(),MarketplaceListing.id.desc()),"most_reported":(report_count.desc(),MarketplaceListing.created_at.desc())}.get(f.sort,(MarketplaceListing.created_at.desc(),MarketplaceListing.id.desc()))
    return await page(session,q.order_by(*order),number=f.page,size=f.page_size)
async def get_listing(session:AsyncSession,listing_id:UUID):
    return (await session.execute(listing_base().where(MarketplaceListing.id==listing_id))).scalar_one_or_none()
async def listing_report_counts(session:AsyncSession,listing_id:UUID):
    row=(await session.execute(select(func.count(ListingReport.id),func.count(ListingReport.id).filter(ListingReport.status==ReportStatus.PENDING)).where(ListingReport.listing_id==listing_id))).one();return int(row[0]),int(row[1])

async def list_reports(session:AsyncSession,f):
    q=select(ListingReport).options(selectinload(ListingReport.reporter),selectinload(ListingReport.reviewing_admin),selectinload(ListingReport.listing).selectinload(MarketplaceListing.farmer).selectinload(FarmerProfile.user))
    if f.status:q=q.where(ListingReport.status==f.status)
    if f.reason:q=q.where(ListingReport.reason==f.reason)
    if f.listing_id:q=q.where(ListingReport.listing_id==f.listing_id)
    order=(ListingReport.created_at.asc(),ListingReport.id.asc()) if f.sort=="oldest" else (ListingReport.created_at.desc(),ListingReport.id.desc())
    return await page(session,q.order_by(*order),number=f.page,size=f.page_size)
async def get_report(session:AsyncSession,report_id:UUID):
    q=select(ListingReport).options(selectinload(ListingReport.reporter),selectinload(ListingReport.reviewing_admin),selectinload(ListingReport.listing).selectinload(MarketplaceListing.farmer).selectinload(FarmerProfile.user)).where(ListingReport.id==report_id)
    return (await session.execute(q)).scalar_one_or_none()
async def count_other_reports(session:AsyncSession,report:ListingReport):
    return int((await session.execute(select(func.count(ListingReport.id)).where(ListingReport.listing_id==report.listing_id,ListingReport.id!=report.id))).scalar_one())

async def add_audit(session:AsyncSession,*,admin_id:UUID,action:str,target_type:str,target_id:UUID|None,metadata:dict[str,object]):
    row=AdminAuditLog(admin_user_id=admin_id,action=action,target_type=target_type,target_id=target_id,metadata_json=metadata);session.add(row);await session.flush();return row
async def list_audits(session:AsyncSession,f):
    q=select(AdminAuditLog).options(selectinload(AdminAuditLog.admin))
    if f.action:q=q.where(AdminAuditLog.action==f.action)
    if f.target_type:q=q.where(AdminAuditLog.target_type==f.target_type)
    if f.admin_user_id:q=q.where(AdminAuditLog.admin_user_id==f.admin_user_id)
    if f.date_from:q=q.where(AdminAuditLog.created_at>=f.date_from)
    if f.date_to:q=q.where(AdminAuditLog.created_at<=f.date_to)
    order=(AdminAuditLog.created_at.asc(),AdminAuditLog.id.asc()) if f.sort=="oldest" else (AdminAuditLog.created_at.desc(),AdminAuditLog.id.desc())
    return await page(session,q.order_by(*order),number=f.page,size=f.page_size)
async def recent_audits(session:AsyncSession):
    return list((await session.execute(select(AdminAuditLog).options(selectinload(AdminAuditLog.admin)).order_by(AdminAuditLog.created_at.desc()).limit(10))).scalars().all())
async def scalar_count(session:AsyncSession,model,condition=None):
    q=select(func.count()).select_from(model)
    if condition is not None:q=q.where(condition)
    return int((await session.execute(q)).scalar_one())