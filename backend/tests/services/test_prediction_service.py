import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ml_service import PredictionService, predict_point_risk, ModelNotAvailableError
from app.schemas.prediction import PointRiskRequest, RiskTypeEnum, PredictionCreate


class TestMLService:
    """Test ML model service — pure sync, no DB needed"""

    def test_load_flood_model(self):
        """Test loading flood ML model"""
        from app.services.ml_service import _load_model
        try:
            model = _load_model(RiskTypeEnum.FLOOD)
            assert model is not None
        except ModelNotAvailableError:
            pytest.skip("Flood ML model not available")

    def test_predict_flood_risk(self):
        """Test ML-based flood risk prediction returns valid range"""
        try:
            req = PointRiskRequest(
                latitude=20.5937,
                longitude=78.9629,
                risk_type=RiskTypeEnum.FLOOD,
                features={
                    "Rainfall (mm)": 150,
                    "Elevation (m)": 150,
                }
            )
            response = predict_point_risk(req)

            assert response is not None
            assert 0.0 <= response.probability <= 1.0   # ✅ valid probability range
        except ModelNotAvailableError:
            pytest.skip("Flood ML model not available")

    def test_predict_earthquake_risk(self):
        """Test earthquake risk prediction returns valid range"""
        try:
            req = PointRiskRequest(
                latitude=28.7041,
                longitude=77.1025,
                risk_type=RiskTypeEnum.EARTHQUAKE,
            )
            response = predict_point_risk(req)

            assert 0.0 <= response.probability <= 1.0
        except ModelNotAvailableError:
            pytest.skip("Earthquake ML model not available")

    def test_predict_cyclone_risk(self):
        """Test cyclone risk prediction returns valid range"""
        try:
            req = PointRiskRequest(
                latitude=15.2993,
                longitude=73.8243,
                risk_type=RiskTypeEnum.CYCLONE,
            )
            response = predict_point_risk(req)

            assert 0.0 <= response.probability <= 1.0
        except ModelNotAvailableError:
            pytest.skip("Cyclone ML model not available")

    def test_predict_incident_severity(self):
        """Test incident severity prediction via ML"""
        try:
            req = PointRiskRequest(
                latitude=20.5937,
                longitude=78.9629,
                risk_type=RiskTypeEnum.FLOOD,
                features={
                    "Water Level (m)": 3.5,
                    "Population Density": 5000,
                }
            )
            response = predict_point_risk(req)

            assert 0.0 <= response.probability <= 1.0
        except ModelNotAvailableError:
            pytest.skip("ML model not available")


class TestPredictionService:
    """Test prediction service with DB integration"""

    async def test_create_prediction(
        self,
        prediction_service: PredictionService,
        db_session: AsyncSession,
        test_incident
    ):
        """Test creating a prediction via service"""
        pred_in = PredictionCreate(
            risk_type=RiskTypeEnum.FLOOD,
            incident_id=test_incident.id,
            probability=0.75,
            confidence_score=0.85
        )
        result = await prediction_service.create(pred_in)

        assert result is not None
        assert result.id is not None            # ✅ DB assigned ID
        assert result.probability == 0.75
        assert result.incident_id == test_incident.id

    async def test_get_prediction_exists(
        self,
        prediction_service: PredictionService,
        prediction_id: int                      # ✅ use fixture, not hardcoded id=1
    ):
        """Test retrieving an existing prediction"""
        result = await prediction_service.get(prediction_id)

        assert result is not None
        assert result.id == prediction_id # type: ignore

    async def test_get_prediction_not_found(
        self,
        prediction_service: PredictionService
    ):
        """Test retrieving non-existent prediction returns None"""
        result = await prediction_service.get(99999)
        assert result is None                   # ✅ not found = None, not exception

    def test_predict_flood_risk_via_service(self):
        """Test flood risk prediction via ML service function"""
        try:
            req = PointRiskRequest(
                latitude=20.5937,
                longitude=78.9629,
                risk_type=RiskTypeEnum.FLOOD,
                features={"Rainfall (mm)": 150}
            )
            response = predict_point_risk(req)
            assert 0.0 <= response.probability <= 1.0
        except ModelNotAvailableError:
            pytest.skip("ML models not available")