from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.emergency_contact import (
    list_contacts_for_user as crud_list_contacts_for_user,
    create_contact_for_user as crud_create_contact_for_user,
)
from app.models.emergency_contact import EmergencyContact
from app.schemas.emergency import EmergencyContactCreate, EmergencyTriggerRequest
from app.core.redis import redis_client


EMERGENCY_CHANNEL = "emergency:sos"


async def list_user_contacts(
    db: AsyncSession,
    user_id: int,
) -> List[EmergencyContact]:
    return await crud_list_contacts_for_user(db, user_id)


async def add_user_contact(
    db: AsyncSession,
    user_id: int,
    contact_in: EmergencyContactCreate,
) -> EmergencyContact:
    return await crud_create_contact_for_user(db, user_id, contact_in)


async def trigger_emergency(
    user_id: int,
    req: EmergencyTriggerRequest,
) -> None:
    """
    Publish an SOS event for this user. Frontend / external services
    can listen on EMERGENCY_CHANNEL to notify contacts, etc.
    """
    if redis_client is None:
        return

    payload = {
        "type": "sos.triggered",
        "user_id": user_id,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "message": req.message,
    }

    import json

    try:
        await redis_client.publish(EMERGENCY_CHANNEL, json.dumps(payload))
    except Exception:
        return

from app.crud.emergency_contact import (
    list_contacts_for_user as crud_list_contacts_for_user,
    create_contact_for_user as crud_create_contact_for_user,
    update_contact as crud_update_contact,  # Add this
    delete_contact as crud_delete_contact,  # Add this
)

# ... existing code ...

async def update_user_contact(
    db: AsyncSession,
    contact_id: int,
    user_id: int,
    contact_in: EmergencyContactCreate,
) -> EmergencyContact:
    return await crud_update_contact(db, contact_id, user_id, contact_in)


async def delete_user_contact(
    db: AsyncSession,
    contact_id: int,
    user_id: int,
) -> bool:
    return await crud_delete_contact(db, contact_id, user_id)