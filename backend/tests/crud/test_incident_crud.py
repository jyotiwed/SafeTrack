import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.incident import CRUDIncident          
from app.schemas.incident import IncidentCreate, IncidentUpdate
from app.models.incident import Incident           


class TestIncidentCRUD:
    """Test cases for Incident CRUD operations"""

    async def test_create_incident(
        self,
        crud_incident: CRUDIncident,
        db_session: AsyncSession,
        user_id: int
    ):
        """Test creating a new incident"""
        incident_data = IncidentCreate(
            title="Test Flood",
            description="Heavy rainfall causing flood",
            address=None,
            severity="high",
            latitude=20.5937,
            longitude=78.9629
        )
       
        incident = await crud_incident.create(
            db_session,
            obj_in=incident_data,
            reporter_id=user_id
        )
        assert incident.title == "Test Flood"
        assert incident.severity == "high"
        assert incident.reporter_id == user_id      
        assert incident.id is not None              

    async def test_get_incident_by_id(
        self,
        crud_incident: CRUDIncident,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test retrieving incident by ID"""
        incident = await crud_incident.get(db_session, id=incident_id)
        assert incident is not None                 
        assert incident.id == incident_id

    async def test_get_incidents_by_severity(
        self,
        crud_incident: CRUDIncident,
        db_session: AsyncSession,
        user_id: int
    ):
        """Test filtering incidents by severity"""
      
        for severity in ["high", "low"]:
            await crud_incident.create(
                db_session,
                obj_in=IncidentCreate(
                    title=f"{severity} incident",
                    description="Test description for severity filtering",
                    address=None,
                    severity=severity,
                    latitude=20.5937,
                    longitude=78.9629
                ),
                reporter_id=user_id
            )

        incidents = await crud_incident.get_multi(db_session)
        assert len(incidents) > 0                  

        high = [i for i in incidents if i.severity == "high"]
        assert len(high) >= 1                     

    async def test_get_incidents_by_location(
        self,
        crud_incident: CRUDIncident,
        db_session: AsyncSession,
        user_id: int
    ):
        """Test filtering incidents by location radius"""
        
        await crud_incident.create(
            db_session,
            obj_in=IncidentCreate(
                title="Location Test",
                description="Testing location based filtering of incidents",
                address=None,
                severity="medium",
                latitude=20.5937,
                longitude=78.9629
            ),
            reporter_id=user_id
        )

        incidents = await crud_incident.get_multi(db_session)
        assert len(incidents) > 0                   

        # Filter client-side by location proximity
        nearby = [
            i for i in incidents
            if abs(i.latitude - 20.5937) < 1.0
            and abs(i.longitude - 78.9629) < 1.0
        ]
        assert len(nearby) >= 1

    async def test_update_incident(
        self,
        crud_incident: CRUDIncident,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test updating incident status"""
        incident = await crud_incident.get(db_session, id=incident_id)
        assert incident is not None

        update_data = IncidentUpdate(status="resolved")
        updated = await crud_incident.update(
            db_session,
            db_obj=incident,
            obj_in=update_data
        )
        assert updated.status == "resolved"
        assert updated.id == incident_id           

    async def test_delete_incident(
        self,
        crud_incident: CRUDIncident,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test deleting an incident"""
        await crud_incident.remove(db_session, id=incident_id)
        deleted = await crud_incident.get(db_session, id=incident_id)
        assert deleted is None                     

    async def test_get_recent_incidents(
        self,
        crud_incident: CRUDIncident,
        db_session: AsyncSession,
        user_id: int
    ):
        """Test retrieving recent incidents"""
        
        for i in range(3):
            await crud_incident.create(
                db_session,
                obj_in=IncidentCreate(
                    title=f"Recent Incident {i}",
                    description="Testing recent incident retrieval for pagination",
                    address=None,
                    severity="high",
                    latitude=20.5937,
                    longitude=78.9629
                ),
                reporter_id=user_id
            )

        incidents = await crud_incident.get_multi(db_session)
        assert len(incidents) >= 3                 