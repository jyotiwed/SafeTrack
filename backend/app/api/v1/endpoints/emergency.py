from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.user import User as UserModel
from app.schemas.emergency import (
    EmergencyContactCreate,
    EmergencyContactRead,
    EmergencyTriggerRequest,
)
from app.services.emergency_service import (
    list_user_contacts,
    add_user_contact,
    trigger_emergency,
    update_user_contact,  # Add this
    delete_user_contact, 
)

router = APIRouter(prefix="/emergency", tags=["emergency"])


@router.get(
    "/contacts",
    response_model=List[EmergencyContactRead],
)
async def get_emergency_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return await list_user_contacts(db, current_user.id) 


@router.post(
    "/contacts",
    response_model=EmergencyContactRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_emergency_contact(
    contact_in: EmergencyContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return await add_user_contact(db, current_user.id, contact_in) 


@router.post(
    "/sos",
    status_code=status.HTTP_202_ACCEPTED,
)
async def sos_trigger(
    req: EmergencyTriggerRequest,
    current_user: UserModel = Depends(get_current_user),
):
    await trigger_emergency(current_user.id, req) 
    return {"status": "accepted"}

@router.put(
    "/contacts/{contact_id}",
    response_model=EmergencyContactRead,
    status_code=status.HTTP_200_OK,
)
async def update_emergency_contact(
    contact_id: int,
    contact_in: EmergencyContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    contact = await update_user_contact(db, contact_id, current_user.id, contact_in)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.delete(
    "/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_emergency_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    success = await delete_user_contact(db, contact_id, current_user.id) 
    if not success:
        raise HTTPException(status_code=404, detail="Contact not found")