from pathlib import Path
from functools import lru_cache

import joblib
import numpy as np

from app.schemas.incident_prediction import (
    IncidentSeverityRequest, # type: ignore
    IncidentSeverityResponse, # type: ignore
    SeverityLevel, # type: ignore
)


current_dir = Path(__file__).resolve()
app_dir = current_dir.parents[1]
BASE_DIR = app_dir.parent
ML_MODELS_DIR = BASE_DIR / "ml_models"

MODEL_FILE = ML_MODELS_DIR / "incident_severity.joblib"


class IncidentModelNotAvailableError(Exception):
    pass


@lru_cache
def _load_incident_model():
    if not MODEL_FILE.exists():
        raise IncidentModelNotAvailableError(
            f"Incident severity model not found at {MODEL_FILE}"
        )
    return joblib.load(MODEL_FILE)


def _build_feature_array(req: IncidentSeverityRequest) -> np.ndarray:
    # Minimal: lat, lon. Later add more features and keep a fixed order.
    feats = [req.latitude, req.longitude]

    if req.features:
        for key in sorted(req.features.keys()):
            try:
                feats.append(float(req.features[key]))
            except (TypeError, ValueError):
                continue

    return np.array(feats, dtype=float).reshape(1, -1)


def predict_incident_severity(
    req: IncidentSeverityRequest,
) -> IncidentSeverityResponse:
    model = _load_incident_model()
    X = _build_feature_array(req)

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)[0]
        classes = list(model.classes_)
    else:
        # Fallback stub: fake probabilities
        classes = ["low", "moderate", "high", "critical"]
        probs = np.array([0.25, 0.25, 0.25, 0.25])

    prob_dict = {str(c): float(p) for c, p in zip(classes, probs)}
    best = max(prob_dict, key=prob_dict.get) # type: ignore
    severity = SeverityLevel(best)

    return IncidentSeverityResponse(
        incident_type=req.incident_type,
        severity=severity,
        probabilities=prob_dict,
    )
