from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.vets import service
from app.modules.vets.schemas import PaginatedPublicVets, PublicVetDetail, VetApplicationPayload, VetPublicFilters, VetSelfResponse, VetSelfUpdate

router = APIRouter(prefix="/vets", tags=["vets"])

@router.get("", response_model=PaginatedPublicVets)
async def list_vets(filters: VetPublicFilters = Depends(), session: AsyncSession = Depends(get_session)) -> PaginatedPublicVets:
    return await service.public_list(session, filters)

@router.post("/apply", response_model=VetSelfResponse, status_code=status.HTTP_201_CREATED)
async def apply(clinic_name: str | None = Form(default=None), specialization: str | None = Form(default=None), region: str = Form(), province: str = Form(), phone: str = Form(), whatsapp: str | None = Form(default=None), document: UploadFile = File(), current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> VetSelfResponse:
    payload = VetApplicationPayload(clinic_name=clinic_name, specialization=specialization, region=region, province=province, phone=phone, whatsapp=whatsapp)
    return await service.apply(session, current_user, payload, document)

@router.get("/me", response_model=VetSelfResponse)
async def me(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> VetSelfResponse:
    return await service.get_me(session, current_user)

@router.patch("/me", response_model=VetSelfResponse)
async def update_me(payload: VetSelfUpdate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> VetSelfResponse:
    return await service.update_me(session, current_user, payload)

@router.post("/me/document", response_model=VetSelfResponse)
async def upload_document(document: UploadFile = File(), current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> VetSelfResponse:
    return await service.replace_document(session, current_user, document)

@router.get("/{vet_id}", response_model=PublicVetDetail)
async def vet_detail(vet_id: UUID, session: AsyncSession = Depends(get_session)) -> PublicVetDetail:
    return await service.public_detail(session, vet_id)
