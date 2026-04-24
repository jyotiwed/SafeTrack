import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services import incident_service as svc
from app.services.incident_service import IncidentNotFoundError 
from app.schemas.incident import IncidentCreate


class TestIncidentService:
    """Test incident business logic service"""

    async def test_create_incident(
        self,
        db_session: AsyncSession,
        user_id: int
    ):
        """Test creating a new incident via service"""
        incident_data = IncidentCreate(
            title="Earthquake",
            description="Building collapse detected in residential area",
            address=None,
            severity="high",
            latitude=28.7041,
            longitude=77.1025
        )
        incident = await svc.create_incident(
            db=db_session,
            incident_in=incident_data,
            reporter_id=user_id
        )

        assert incident.title == "Earthquake"
        assert incident.severity == "high"
        assert incident.reporter_id == user_id  
        assert incident.id is not None          

    async def test_get_incident(
        self,
        db_session: AsyncSession,
        test_incident
    ):
        """Test retrieving an incident by ID"""
        incident = await svc.get_incident(
            db=db_session,
            incident_id=test_incident.id
        )

        assert incident is not None
        assert incident.id == test_incident.id
        assert incident.title == test_incident.title

    async def test_list_incidents(
        self,
        db_session: AsyncSession,
        test_incident                          
    ):
        """Test listing incidents returns a list"""
        incidents = await svc.list_incidents(
            db=db_session,
            limit=10,
            offset=0
        )

        assert isinstance(incidents, list)
        assert len(incidents) >= 1             

    async def test_get_incident_not_found(
        self,
        db_session: AsyncSession
    ):
        """Test error raised when incident does not exist"""
        with pytest.raises(IncidentNotFoundError):
            await svc.get_incident(db=db_session, incident_id=99999)

    async def test_update_incident(
        self,
        db_session: AsyncSession,
        test_incident
    ):
        """Test updating incident status via service"""
        from app.schemas.incident import IncidentUpdate

        updated = await svc.update_incident(
            db=db_session,
            incident_id=test_incident.id,
            incident_in=IncidentUpdate(status="resolved")
        )

        assert updated.status == "resolved"
        assert updated.id == test_incident.id   

    async def test_delete_incident(
        self,
        db_session: AsyncSession,
        user_id: int
    ):
        """Test deleting an incident via service"""
       
        incident = await svc.create_incident(
            db=db_session,
            incident_in=IncidentCreate(
                title="To Delete",
                description="This incident will be deleted in the delete test",
                address=None,
                severity="low",
                latitude=20.0,
                longitude=78.0
            ),
            reporter_id=user_id
        )

        await svc.delete_incident(db=db_session, incident_id=incident.id)

        with pytest.raises(IncidentNotFoundError):
            await svc.get_incident(db=db_session, incident_id=incident.id)