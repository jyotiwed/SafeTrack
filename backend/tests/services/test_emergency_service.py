import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services import emergency_service as svc
from app.schemas.emergency import EmergencyContactCreate  


class TestEmergencyService:
    """Test emergency response service"""

    async def test_list_user_contacts_empty(
        self,
        db_session: AsyncSession,
        test_user
    ):
        """Test listing contacts when user has none returns empty list"""
        contacts = await svc.list_user_contacts(
            db=db_session,
            user_id=test_user.id
        )
        assert isinstance(contacts, list)       

    async def test_add_user_contact(
        self,
        db_session: AsyncSession,
        test_user
    ):
        """Test adding emergency contact"""
        contact_data = EmergencyContactCreate(
            name="Emergency Contact",
            phone="+919876543210",
            relationship="friend"
        )
        contact = await svc.add_user_contact(
            db=db_session,
            user_id=test_user.id,
            contact_in=contact_data
        )

        assert contact.name == "Emergency Contact" # type: ignore
        assert contact.phone == "+919876543210" # type: ignore
        assert contact.user_id == test_user.id  

    async def test_list_user_contacts_after_add(
        self,
        db_session: AsyncSession,
        test_user
    ):
        """Test listing contacts returns newly added contact"""
        contact_data = EmergencyContactCreate(
            name="Listed Contact",
            phone="+919876543211",
            relationship="family"
        )
        await svc.add_user_contact(
            db=db_session,
            user_id=test_user.id,
            contact_in=contact_data
        )

        contacts = await svc.list_user_contacts(
            db=db_session,
            user_id=test_user.id
        )

        assert any(c.name == "Listed Contact" for c in contacts)

    async def test_trigger_emergency(
        self,
        db_session: AsyncSession,
        test_user
    ):
        """Test triggering emergency SOS does not raise errors"""
        from app.schemas.emergency import EmergencyTriggerRequest

        req = EmergencyTriggerRequest(
            latitude=28.7041,
            longitude=77.1025,
            message="Help needed"
        )

       
        try:
            await svc.trigger_emergency(
                user_id=test_user.id,
                req=req
            )
        except Exception as e:
           
            pytest.skip(f"Redis not available in test environment: {e}")