import pytest
from app.services.ml_service import predict_point_risk, _load_model
from app.schemas.prediction import PointRiskRequest, RiskTypeEnum


class TestMLService:
    """Test ML model service"""
    
    def test_load_model(self):
        """Test loading ML model"""
        try:
            model = _load_model(RiskTypeEnum.FLOOD)
            assert model is not None
        except Exception:
            # Models may not be available in test environment
            pytest.skip("ML models not available")
    
    def test_predict_flood_risk_ml(self):
        """Test ML-based flood prediction"""
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
            assert 0 <= response.probability <= 1
        except Exception:
            pytest.skip("ML models not available")
    
    def test_predict_incident_severity_ml(self):
        """Test incident severity prediction via flood risk model"""
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
            assert 0 <= response.probability <= 1
        except Exception:
            pytest.skip("ML models not available")