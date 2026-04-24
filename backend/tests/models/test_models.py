import pytest
from app.models.user import User
from app.models.incident import Incident
from app.models.prediction import Prediction, RiskTypeEnum
from app.models.task import Task
from app.schemas.task import TaskPriority


class TestUserModel:
    """Test User model instantiation"""

    def test_user_creation(self):
        user = User(
            email="test@example.com",
            full_name="Test User",
            hashed_password="hashed_pwd"
        )
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"

    def test_user_relationships(self):
        user = User(
            email="test@example.com",
            full_name="Test",
            hashed_password="hash"
        )
        assert hasattr(user, 'incidents')
        assert hasattr(user, 'tasks')
        assert hasattr(user, 'guidelines')


class TestIncidentModel:
    """Test Incident model instantiation"""

    def test_incident_creation(self):
        incident = Incident(
            title="Flood",
            description="Heavy rainfall",
            severity="high",
            latitude=20.5937,
            longitude=78.9629,
            reporter_id=1
        )
        assert incident.title == "Flood"
        assert incident.latitude == 20.5937

    def test_incident_default_status(self):
        incident = Incident(
            title="Earthquake",
            description="Building collapse",
            severity="critical",
            latitude=28.7041,
            longitude=77.1025,
            reporter_id=1
        )
        assert incident.title == "Earthquake"
        assert incident.severity == "critical"


class TestPredictionModel:
    """Test Prediction model instantiation"""

    def test_prediction_creation(self):
        prediction = Prediction(
            risk_type=RiskTypeEnum.FLOOD,   
            incident_id=1,
            probability=0.75,
            confidence_score=0.85
        )
        assert prediction.risk_type == RiskTypeEnum.FLOOD
        assert prediction.probability == 0.75


class TestTaskModel:
    """Test Task model instantiation"""

    def test_task_creation(self):
        task = Task(
            title="Evacuation",
            description="Start evacuation",
            incident_id=1,
            assignee_id=1,
            priority=TaskPriority.HIGH,    
        )
        assert task.title == "Evacuation"
        assert task.priority == TaskPriority.HIGH