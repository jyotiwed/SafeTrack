# tests/ml_models/test_ml_models.py
import pytest
from app.services.ml_service import predict_point_risk, _load_model, ModelNotAvailableError
from app.schemas.prediction import PointRiskRequest, RiskTypeEnum

class TestFloodRiskModel:
    """Test flood risk prediction model functionality"""
    
    def test_model_loading(self) -> None:
        """Test that flood model loads successfully from disk"""
        try:
            model = _load_model(RiskTypeEnum.FLOOD)
            assert model is not None
        except ModelNotAvailableError:
            pytest.skip("Flood risk model file (flood_risk.joblib) not available or corrupted")
        except Exception as e:
            pytest.fail(f"Unexpected error loading flood model: {e}")
    
    def test_flood_prediction_range(self) -> None:
        """Test that flood predictions return probability between 0.0 and 1.0"""
        try:
            req = PointRiskRequest(
                latitude=20.5937,
                longitude=78.9629,
                risk_type=RiskTypeEnum.FLOOD,
                features={  
                    "Rainfall (mm)": 150.0,
                    "Humidity (%)": 75.0,
                    "Elevation (m)": 150.0,
                }
            )
            response = predict_point_risk(req)
            assert 0.0 <= response.probability <= 1.0
        except ModelNotAvailableError:
            pytest.skip("Flood risk model not available")
        except Exception as e:
            pytest.fail(f"Unexpected error in flood prediction: {e}")
    
    

class TestCycloneRiskModel:
    """Test cyclone risk prediction model functionality"""
    
    def test_cyclone_model_loading(self) -> None:
        """Test that cyclone model loads successfully"""
        try:
            model = _load_model(RiskTypeEnum.CYCLONE)
            assert model is not None
        except ModelNotAvailableError:
            pytest.skip("Cyclone risk model file (cyclone_risk.joblib) not available or corrupted")
        except Exception as e:
            pytest.fail(f"Unexpected error loading cyclone model: {e}")
    
    def test_cyclone_prediction_valid_range(self) -> None:
        """Test that cyclone predictions return probability between 0.0 and 1.0"""
        try:
            req = PointRiskRequest(
                latitude=15.2993,
                longitude=73.8243,
                risk_type=RiskTypeEnum.CYCLONE,
            )
            response = predict_point_risk(req)
            assert 0.0 <= response.probability <= 1.0
        except ModelNotAvailableError:
            pytest.skip("Cyclone risk model not available")
        except Exception as e:
            pytest.fail(f"Unexpected error in cyclone prediction: {e}")