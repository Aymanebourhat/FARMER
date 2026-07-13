from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.vets import service
from app.modules.vets.schemas import AdminVetDetail, AdminVetFilters, PaginatedAdminVets, VetRejectionRequest

router = APIRouter(prefix="/admin/vets", tags=["admin-vets"])

@router.get("/pending", response_model=PaginatedAdminVets)
async def pending(filters: AdminVetFilters = Depends(), current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> PaginatedAdminVets:
    return await service.pending(session, current_user, filters)

@router.get("/{vet_id}", response_model=AdminVetDetail)
async def detail(vet_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> AdminVetDetail:
    return await service.admin_detail(session, current_user, vet_id)

@router.get("/{vet_id}/document")
async def document(vet_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> Response:
    content, mime, extension = await service.document_bytes(session, current_user, vet_id)
    return Response(content=content, media_type=mime, headers={"Content-Disposition": f'attachment; filename="vet-verification-{vet_id}{extension}"', "X-Content-Type-Options": "nosniff"})

@router.patch("/{vet_id}/approve", response_model=AdminVetDetail)
async def approve(vet_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> AdminVetDetail:
    return await service.approve(session, current_user, vet_id)

@router.patch("/{vet_id}/reject", response_model=AdminVetDetail)
async def reject(vet_id: UUID, payload: VetRejectionRequest, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> AdminVetDetail:
    return await service.reject(session, current_user, vet_id, payload.reason)
