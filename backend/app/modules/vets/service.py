import asyncio
import logging
from datetime import UTC, datetime
from io import BytesIO
from math import ceil
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import not_found, validation_error
from app.core.permissions import require_admin, require_role
from app.core.regions import is_valid_region, is_valid_region_province
from app.modules.media.service import delete_private_vet_document, private_vet_document_path, save_private_vet_document
from app.modules.users.models import User, UserRole, UserStatus
from app.modules.vets import repository
from app.modules.admin import repository as admin_repository
from app.modules.vets.models import VetProfile, VetVerificationStatus
from app.modules.vets.schemas import (AdminVetDetail, AdminVetSummary, PaginatedAdminVets, PaginatedPublicVets, PublicVetDetail, PublicVetSummary, VetApplicationPayload, VetSelfResponse, VetSelfUpdate)

logger = logging.getLogger(__name__)

_ALLOWED = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png"}

def _location(region: str | None, province: str | None) -> None:
    if not region or not province or not is_valid_region_province(region, province): raise validation_error("Province does not belong to selected Morocco region")

def _public(profile: VetProfile) -> PublicVetSummary:
    return PublicVetSummary(id=profile.id, full_name=profile.user.full_name, clinic_name=profile.clinic_name, specialization=profile.specialization, region=profile.region, province=profile.province, phone=profile.phone, whatsapp=profile.whatsapp, verified_at=profile.verified_at)

def _self(profile: VetProfile) -> VetSelfResponse:
    return VetSelfResponse(id=profile.id, clinic_name=profile.clinic_name, specialization=profile.specialization, region=profile.region, province=profile.province, phone=profile.phone, whatsapp=profile.whatsapp, verification_status=profile.verification_status, rejection_reason=profile.rejection_reason, verified_at=profile.verified_at, has_document=bool(profile.license_document_key), document_mime_type=profile.license_document_mime_type, document_size_bytes=profile.license_document_size_bytes, created_at=profile.created_at, updated_at=profile.updated_at)

def _admin(profile: VetProfile) -> AdminVetDetail:
    return AdminVetDetail(id=profile.id, user_id=profile.user_id, full_name=profile.user.full_name, clinic_name=profile.clinic_name, specialization=profile.specialization, region=profile.region, province=profile.province, phone=profile.phone, whatsapp=profile.whatsapp, has_document=bool(profile.license_document_key), document_mime_type=profile.license_document_mime_type, document_size_bytes=profile.license_document_size_bytes, created_at=profile.created_at, updated_at=profile.updated_at, verification_status=profile.verification_status, rejection_reason=profile.rejection_reason, verified_at=profile.verified_at)

async def _document(file: UploadFile) -> tuple[bytes, str, str]:
    mime = file.content_type or ""
    if mime not in _ALLOWED: raise validation_error("Only PDF, JPEG, and PNG documents are accepted")
    try: content = await file.read(get_settings().vet_document_max_upload_bytes + 1)
    finally: await file.close()
    if not content: raise validation_error("Document cannot be empty")
    if len(content) > get_settings().vet_document_max_upload_bytes: raise validation_error("Document cannot exceed 10 MB")
    if mime == "application/pdf":
        if not content.startswith(b"%PDF-"): raise validation_error("File content does not match PDF")
    else:
        try:
            with Image.open(BytesIO(content)) as image:
                image.verify()
                if (mime == "image/jpeg" and image.format != "JPEG") or (mime == "image/png" and image.format != "PNG"): raise validation_error("File content does not match declared image type")
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc: raise validation_error("Invalid image document") from exc
    return content, mime, _ALLOWED[mime]

async def _store(profile_id: UUID, file: UploadFile) -> tuple[str, str, int]:
    content, mime, extension = await _document(file)
    return await save_private_vet_document(vet_profile_id=profile_id, content=content, extension=extension), mime, len(content)

async def apply(session: AsyncSession, user: User, payload: VetApplicationPayload, document: UploadFile) -> VetSelfResponse:
    require_role(user, UserRole.VET); _location(payload.region, payload.province); existing = await repository.get_by_user(session, user.id)
    if existing and existing.verification_status in {VetVerificationStatus.PENDING, VetVerificationStatus.APPROVED}: raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vet application already exists")
    content, mime, extension = await _document(document)
    profile = existing or repository.create(session, user_id=user.id, **payload.model_dump())
    if existing:
        for key, value in payload.model_dump().items(): setattr(profile, key, value)
    key = await save_private_vet_document(vet_profile_id=profile.id, content=content, extension=extension)
    size = len(content); old = profile.license_document_key
    profile.license_document_key, profile.license_document_mime_type, profile.license_document_size_bytes = key, mime, size
    profile.verification_status, profile.verified_at, profile.rejection_reason = VetVerificationStatus.PENDING, None, None
    try:
        await session.commit(); await session.refresh(profile)
    except Exception:
        await session.rollback(); await delete_private_vet_document(key); raise
    await delete_private_vet_document(old); return _self(profile)

async def get_me(session: AsyncSession, user: User) -> VetSelfResponse:
    require_role(user, UserRole.VET); profile = await repository.get_by_user(session, user.id)
    if not profile: raise not_found("Vet application not found")
    return _self(profile)

async def update_me(session: AsyncSession, user: User, payload: VetSelfUpdate) -> VetSelfResponse:
    require_role(user, UserRole.VET); profile = await repository.get_by_user(session, user.id)
    if not profile: raise not_found("Vet application not found")
    values=payload.model_dump(exclude_unset=True); region=values.get("region", profile.region); province=values.get("province", profile.province); _location(region, province)
    for key,value in values.items(): setattr(profile,key,value)
    await session.commit(); await session.refresh(profile); return _self(profile)

async def replace_document(session: AsyncSession, user: User, document: UploadFile) -> VetSelfResponse:
    require_role(user, UserRole.VET); profile=await repository.get_by_user(session,user.id)
    if not profile: raise not_found("Vet application not found")
    key,mime,size=await _store(profile.id,document); old=profile.license_document_key
    profile.license_document_key,profile.license_document_mime_type,profile.license_document_size_bytes=key,mime,size
    profile.verification_status,profile.verified_at,profile.rejection_reason=VetVerificationStatus.PENDING,None,None
    try: await session.commit(); await session.refresh(profile)
    except Exception: await session.rollback(); await delete_private_vet_document(key); raise
    await delete_private_vet_document(old); return _self(profile)

async def public_list(session: AsyncSession, filters) -> PaginatedPublicVets:
    if filters.region and not is_valid_region(filters.region): raise validation_error("Unknown Morocco region")
    if filters.province and (not filters.region or not is_valid_region_province(filters.region, filters.province)): raise validation_error("Province does not belong to selected Morocco region")
    rows,total=await repository.list_public(session,filters); return PaginatedPublicVets(items=[_public(row) for row in rows],page=filters.page,page_size=filters.page_size,total=total,pages=ceil(total/filters.page_size) if total else 0)

async def public_detail(session: AsyncSession, vet_id: UUID) -> PublicVetDetail:
    profile=await repository.get_public(session,vet_id)
    if not profile: raise not_found("Vet not found")
    return PublicVetDetail(**_public(profile).model_dump())

async def pending(session: AsyncSession, admin: User, filters) -> PaginatedAdminVets:
    require_admin(admin); _location(filters.region, filters.province) if filters.region or filters.province else None
    rows,total=await repository.list_pending(session,filters); return PaginatedAdminVets(items=[AdminVetSummary(**_admin(row).model_dump(exclude={"verification_status","rejection_reason","verified_at"})) for row in rows],page=filters.page,page_size=filters.page_size,total=total,pages=ceil(total/filters.page_size) if total else 0)

async def admin_detail(session: AsyncSession, admin: User, vet_id: UUID) -> AdminVetDetail:
    require_admin(admin); profile=await repository.get_by_id(session,vet_id)
    if not profile: raise not_found("Vet application not found")
    return _admin(profile)

async def document_bytes(session: AsyncSession, admin: User, vet_id: UUID) -> tuple[bytes,str,str]:
    profile=await admin_detail(session,admin,vet_id); row=await repository.get_by_id(session,vet_id); path=private_vet_document_path(row.license_document_key or "") if row else None
    if not path or not path.is_file(): raise not_found("Vet document not found")
    return await asyncio.to_thread(path.read_bytes), row.license_document_mime_type or "application/octet-stream", path.suffix

async def approve(session: AsyncSession, admin: User, vet_id: UUID) -> AdminVetDetail:
    require_admin(admin); profile=await repository.get_by_id(session,vet_id)
    if not profile: raise not_found("Vet application not found")
    if profile.user.role != UserRole.VET or profile.user.status != UserStatus.ACTIVE: raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Vet user cannot be approved")
    path=private_vet_document_path(profile.license_document_key or "")
    if not path or not path.is_file(): raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Valid verification document is required")
    if profile.verification_status == VetVerificationStatus.APPROVED: raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Vet is already approved")
    profile.verification_status,profile.verified_at,profile.rejection_reason=VetVerificationStatus.APPROVED,datetime.now(UTC),None
    await admin_repository.add_audit(session, admin_id=admin.id, action="vet.approve", target_type="vet_application", target_id=profile.id, metadata={"status": "approved"})
    await session.commit(); await session.refresh(profile); logger.info("vet.approved", extra={"vet_profile_id": str(profile.id), "actor_user_id": str(admin.id)}); return _admin(profile)

async def reject(session: AsyncSession, admin: User, vet_id: UUID, reason: str) -> AdminVetDetail:
    require_admin(admin); profile=await repository.get_by_id(session,vet_id)
    if not profile: raise not_found("Vet application not found")
    if profile.verification_status == VetVerificationStatus.REJECTED: raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Vet is already rejected")
    profile.verification_status,profile.verified_at,profile.rejection_reason=VetVerificationStatus.REJECTED,None,reason
    await admin_repository.add_audit(session, admin_id=admin.id, action="vet.reject", target_type="vet_application", target_id=profile.id, metadata={"status": "rejected"})
    await session.commit(); await session.refresh(profile); logger.info("vet.rejected", extra={"vet_profile_id": str(profile.id), "actor_user_id": str(admin.id)}); return _admin(profile)



