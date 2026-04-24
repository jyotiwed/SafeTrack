import pytest
from app.crud.emergency_contact import CRUDEmergencyContact        
from app.schemas.emergency import EmergencyContactCreate  


class TestEmergencyContactCRUD:
    """Test cases for Emergency Contact CRUD"""

    async def test_create_emergency_contact(
        self,
        crud_emergency_contact: CRUDEmergencyContact,
        db_session,
        user_id: int
    ):
        """Test creating an emergency contact"""
        contact_data = EmergencyContactCreate(
            name="Emergency Services",
            phone="+91-9999999999",
            relationship="emergency_service"
        )
        contact = await crud_emergency_contact.create(
            db_session,
            obj_in=contact_data,
            user_id=user_id
        )

        assert contact.name == "Emergency Services" # type: ignore
        assert contact.phone == "+91-9999999999" # type: ignore
        assert contact.user_id == user_id              # type: ignore
        assert contact.id is not None                  

    async def test_get_user_emergency_contacts(
        self,
        crud_emergency_contact: CRUDEmergencyContact,
        db_session,
        user_id: int
    ):
        """Test retrieving user's emergency contacts"""

        
        for i in range(2):
            contact_data = EmergencyContactCreate(
                name=f"Contact {i}",
                phone=f"+91-888888888{i}",
                relationship="friend"
            )
            await crud_emergency_contact.create(
                db_session,
                obj_in=contact_data,
                user_id=user_id
            )

        contacts = await crud_emergency_contact.get_by_user(
            db_session,
            user_id=user_id
        )

        assert len(contacts) >= 2                              
        assert all(c.user_id == user_id for c in contacts)   

    async def test_delete_emergency_contact(
        self,
        crud_emergency_contact: CRUDEmergencyContact,
        db_session,
        user_id: int
    ):
        """Test deleting an emergency contact"""
        contact_data = EmergencyContactCreate(
            name="To Be Deleted",
            phone="+91-7777777777",
            relationship="colleague"
        )
        contact = await crud_emergency_contact.create(
            db_session,
            obj_in=contact_data,
            user_id=user_id
        )

        # Delete it
        await crud_emergency_contact.remove(db_session, id=contact.id) # type: ignore

        # Verify it's gone
        contacts = await crud_emergency_contact.get_by_user(
            db_session,
            user_id=user_id
        )
        ids = [c.id for c in contacts]
        assert contact.id not in ids                          

    async def test_create_multiple_contacts_same_user(
        self,
        crud_emergency_contact: CRUDEmergencyContact,
        db_session,
        user_id: int
    ):
        """Test that one user can have multiple emergency contacts"""
        contacts_data = [
            EmergencyContactCreate(
                name="Doctor",
                phone="+91-1111111111",
                relationship="doctor"
            ),
            EmergencyContactCreate(
                name="Family",
                phone="+91-2222222222",
                relationship="family"
            ),
        ]

        created = []
        for data in contacts_data:
            c = await crud_emergency_contact.create(
                db_session,
                obj_in=data,
                user_id=user_id
            )
            created.append(c)

        assert len(created) == 2
        assert created[0].id != created[1].id                 # ✅ distinct records
        assert all(c.user_id == user_id for c in created)     # ✅ same owner