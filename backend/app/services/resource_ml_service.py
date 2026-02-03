from pathlib import Path
from functools import lru_cache

import joblib
import numpy as np

from app.schemas.resource_prediction import (
    ResourceDemandRequest,
    ResourceDemandResponse,
)


current_dir = Path(__file__).resolve()
app_dir = current_dir.parents[1]
BASE_DIR = app_dir.parent
ML_MODELS_DIR = BASE_DIR / "ml_models"

MODEL_FILE = ML_MODELS_DIR / "resource_demand.joblib"


class ResourceModelNotAvailableError(Exception):
    pass


@lru_cache
def _load_resource_model():
    if not MODEL_FILE.exists():
        raise ResourceModelNotAvailableError(
            f"Resource demand model not found at {MODEL_FILE}"
        )
    return joblib.load(MODEL_FILE)


def _build_feature_array(req: ResourceDemandRequest) -> np.ndarray:
    feats = [
        req.affected_population,
        req.area_km2,
    ]
    if req.features:
        for key in sorted(req.features.keys()):
            try:
                feats.append(float(req.features[key]))
            except (TypeError, ValueError):
                continue
    return np.array(feats, dtype=float).reshape(1, -1)


def predict_resource_demand(
    req: ResourceDemandRequest,
) -> ResourceDemandResponse:
    model = _load_resource_model()
    X = _build_feature_array(req)

    # Expecting model.predict to return [teams, boats, ambulances]
    y = model.predict(X)[0]
    teams, boats, ambulances = [int(round(v)) for v in y]

    return ResourceDemandResponse(
        incident_id=req.incident_id,
        severity=req.severity,
        teams_needed=max(0, teams),
        boats_needed=max(0, boats),
        ambulances_needed=max(0, ambulances),
    )
