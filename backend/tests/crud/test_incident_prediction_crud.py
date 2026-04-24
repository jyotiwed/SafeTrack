import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.incident_prediction import CRUDIncidentPrediction   
from app.schemas.incident_prediction import IncidentPredictionCreate


class TestIncidentPredictionCRUD:
    """Test cases for Incident Prediction CRUD"""

    async def test_create_incident_prediction(
        self,
        crud_incident_prediction: CRUDIncidentPrediction,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test creating incident prediction"""
        pred_data = IncidentPredictionCreate(
            incident_id=incident_id,
            risk_score=8,
            predicted_severity="high",
            forecast_date=datetime.now(),
            confidence_level=0.92
        )
        prediction = await crud_incident_prediction.create(
            db_session,
            obj_in=pred_data
        )

        assert prediction.incident_id == incident_id
        assert prediction.predicted_severity == "high"
        assert prediction.risk_score == 8              
        assert prediction.id is not None               

    async def test_get_prediction_by_incident(
        self,
        crud_incident_prediction: CRUDIncidentPrediction,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test retrieving predictions for a specific incident"""
        
        pred_data = IncidentPredictionCreate(
            incident_id=incident_id,
            risk_score=7,
            predicted_severity="medium",
            forecast_date=datetime.now(),
            confidence_level=0.85
        )
        await crud_incident_prediction.create(db_session, obj_in=pred_data)

        # Fetch and verify
        predictions = await crud_incident_prediction.get_multi(db_session)
        incident_preds = [p for p in predictions if p.incident_id == incident_id]

        assert len(incident_preds) >= 1               
        assert all(
            p.incident_id == incident_id
            for p in incident_preds
        )

    async def test_get_high_confidence_predictions(
        self,
        crud_incident_prediction: CRUDIncidentPrediction,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test filtering high confidence predictions"""
        for confidence, severity in [(0.95, "high"), (0.50, "low")]:
            await crud_incident_prediction.create(
                db_session,
                obj_in=IncidentPredictionCreate(
                    incident_id=incident_id,
                    risk_score=9,
                    predicted_severity=severity,
                    forecast_date=datetime.now(),
                    confidence_level=confidence
                )
            )

        predictions = await crud_incident_prediction.get_multi(db_session)
        high_confidence = [p for p in predictions if p.confidence_level >= 0.9]

        assert len(high_confidence) >= 1              
        assert all(
            p.confidence_level >= 0.9
            for p in high_confidence
        )

    async def test_delete_incident_prediction(
        self,
        crud_incident_prediction: CRUDIncidentPrediction,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test deleting an incident prediction"""
        pred_data = IncidentPredictionCreate(
            incident_id=incident_id,
            risk_score=5,
            predicted_severity="medium",
            forecast_date=datetime.now(),
            confidence_level=0.75
        )
        prediction = await crud_incident_prediction.create(
            db_session,
            obj_in=pred_data
        )

        await crud_incident_prediction.remove(db_session, id=prediction.id)
        deleted = await crud_incident_prediction.get(db_session, id=prediction.id)
        assert deleted is None                        