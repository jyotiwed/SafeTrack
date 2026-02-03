from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.emergency_contact import EmergencyContact
from app.schemas.emergency import EmergencyContactCreate


async def list_contacts_for_user(
    db: AsyncSession,
    user_id: int,
) -> List[EmergencyContact]:
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.user_id == user_id)
        .order_by(EmergencyContact.created_at.desc())
    )
    return list(result.scalars().all())

    


async def create_contact_for_user(
    db: AsyncSession,
    user_id: int,
    contact_in: EmergencyContactCreate,
) -> EmergencyContact:
    obj = EmergencyContact(
        user_id=user_id,
        name=contact_in.name,
        phone=contact_in.phone,
        relationship=contact_in.relationship,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj

async def update_contact(
    db: AsyncSession,
    contact_id: int,
    user_id: int,
    contact_in: EmergencyContactCreate,
) -> EmergencyContact:
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.id == contact_id)
        .where(EmergencyContact.user_id == user_id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        return None # type: ignore
    
    contact.name = contact_in.name # type: ignore
    contact.phone = contact_in.phone # type: ignore
    contact.relationship = contact_in.relationship # type: ignore
    
    await db.commit()
    await db.refresh(contact)
    return contact


async def delete_contact(
    db: AsyncSession,
    contact_id: int,
    user_id: int,
) -> bool:
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.id == contact_id)
        .where(EmergencyContact.user_id == user_id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        return False
    
    await db.delete(contact)
    await db.commit()
    return True