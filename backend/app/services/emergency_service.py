from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.emergency_contact import (
    list_contacts_for_user as crud_list_contacts_for_user,
    create_contact_for_user as crud_create_contact_for_user,
)
from app.models.emergency_contact import EmergencyContact
from app.schemas.emergency import EmergencyContactCreate, EmergencyTriggerRequest
from app.core import redis as core_redis


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
    if core_redis.redis_client is None:
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
        await core_redis.redis_client.publish(EMERGENCY_CHANNEL, json.dumps(payload))
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

# emergency_service.py
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession

class EmergencyService:
    """
    Handles emergency contacts and notifications. Inject `contact_crud` and optional `notifier` client.
    """

    def __init__(self, db: AsyncSession, contact_crud=None, notifier=None):
        self.db = db
        self.contact_crud = contact_crud
        self.notifier = notifier

    async def add_contact(self, contact_in):
        if not self.contact_crud:
            raise RuntimeError("contact_crud required")
        return await self.contact_crud.create(self.db, obj_in=contact_in)

    async def list_contacts_for_user(self, user_id: int) -> Sequence[object]:
        if not self.contact_crud:
            raise RuntimeError("contact_crud required")
        return await self.contact_crud.list_for_user(self.db, user_id=user_id)

    async def alert_contacts(self, user_id: int, message: str) -> int:
        contacts = await self.list_contacts_for_user(user_id)
        sent = 0
        if not self.notifier:
            raise RuntimeError("notifier client required to send alerts")
        for c in contacts:
            await self.notifier.send(contact=c, message=message)
            sent += 1
        return sent