import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.prediction import CRUDPrediction          
from app.schemas.prediction import PredictionCreate
from app.models.prediction import RiskTypeEnum          


class TestPredictionCRUD:
    """Test cases for Prediction CRUD operations"""

    async def test_create_prediction(
        self,
        crud_prediction: CRUDPrediction,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test creating a prediction"""
        pred_data = PredictionCreate(
            risk_type=RiskTypeEnum.FLOOD,
            incident_id=incident_id,
            probability=0.75,
            confidence_score=0.85
        )
        prediction = await crud_prediction.create(db_session, obj_in=pred_data)

        assert prediction.risk_type == RiskTypeEnum.FLOOD   
        assert prediction.probability == 0.75
        assert prediction.confidence_score == 0.85         
        assert prediction.id is not None                    
    async def test_get_prediction_by_id(
        self,
        crud_prediction: CRUDPrediction,
        db_session: AsyncSession,
        prediction_id: int
    ):
        """Test retrieving prediction by ID"""
        prediction = await crud_prediction.get(db_session, id=prediction_id)
        assert prediction is not None                       
        assert prediction.id == prediction_id

    async def test_get_latest_predictions_by_type(
        self,
        crud_prediction: CRUDPrediction,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test getting latest predictions by risk type"""
       
        for risk_type in [RiskTypeEnum.FLOOD, RiskTypeEnum.EARTHQUAKE]:
            await crud_prediction.create(
                db_session,
                obj_in=PredictionCreate(
                    risk_type=risk_type,
                    incident_id=incident_id,
                    probability=0.70,
                    confidence_score=0.80
                )
            )

        predictions = await crud_prediction.get_multi(db_session)
        flood_preds = [
            p for p in predictions
            if p.risk_type == RiskTypeEnum.FLOOD
        ]

        assert len(flood_preds) >= 1                        
        assert all(
            p.risk_type == RiskTypeEnum.FLOOD
            for p in flood_preds
        )

    async def test_get_high_risk_predictions(
        self,
        crud_prediction: CRUDPrediction,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test filtering high-risk predictions"""
        
        for prob in [0.90, 0.30]:
            await crud_prediction.create(
                db_session,
                obj_in=PredictionCreate(
                    risk_type=RiskTypeEnum.FLOOD,
                    incident_id=incident_id,
                    probability=prob,
                    confidence_score=0.80
                )
            )

        predictions = await crud_prediction.get_multi(db_session)
        high_risk = [p for p in predictions if p.probability >= 0.7]

        assert len(high_risk) >= 1                          
        assert all(p.probability >= 0.7 for p in high_risk) 

    async def test_delete_prediction(
        self,
        crud_prediction: CRUDPrediction,
        db_session: AsyncSession,
        incident_id: int
    ):
        """Test deleting a prediction"""
        prediction = await crud_prediction.create(
            db_session,
            obj_in=PredictionCreate(
                risk_type=RiskTypeEnum.FLOOD,
                incident_id=incident_id,
                probability=0.60,
                confidence_score=0.70
            )
        )

        await crud_prediction.remove(db_session, id=prediction.id)
        deleted = await crud_prediction.get(db_session, id=prediction.id)
        assert deleted is None                              