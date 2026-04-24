import joblib
from pathlib import Path


class ModelLoader:
    """
    Centralized loader for all ML models (.joblib files)
    """

    _BASE_DIR = Path(__file__).resolve().parent
    _CACHE = {}

    _MODELS = {
        "flood_risk": "flood_risk.joblib",
        "earthquake_risk": "earthquake_risk.joblib",
        "cyclone_risk": "cyclone_risk.joblib",
        "incident_severity": "incident_severity.joblib",
        "resource_demand": "resource_demand.joblib",
    }

    @classmethod
    def load_model(cls, model_name: str):
        """
        Load a model by name (with caching)
        """
        if model_name not in cls._MODELS:
            raise ValueError(f"Unknown model: {model_name}")

        # Return cached model if already loaded
        if model_name in cls._CACHE:
            return cls._CACHE[model_name]

        model_path = cls._BASE_DIR / cls._MODELS[model_name]

        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        model = joblib.load(model_path)
        cls._CACHE[model_name] = model
        return model
