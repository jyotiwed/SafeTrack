# app/services/ml_service.py

from copyreg import pickle
import math
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, TypedDict
import pickle

import joblib
import numpy as np
import pandas as pd

from app.schemas.prediction import (
    RiskTypeEnum,
    PointRiskRequest,
    PointRiskResponse,
    AreaRiskRequest,
    AreaRiskResponse,
    GridCell,
)
BASE_DIR = Path(__file__).resolve().parents[2]  
ML_MODELS_DIR = BASE_DIR / "ml_models"

class ModelNotAvailableError(Exception):
    pass

@lru_cache
def _load_model(risk_type: RiskTypeEnum):
    filename = {
        RiskTypeEnum.FLOOD: "flood_risk.joblib",
        RiskTypeEnum.CYCLONE: "cyclone_risk.joblib",
        RiskTypeEnum.EARTHQUAKE: "earthquake_risk.joblib",
    }.get(risk_type)
    
    if filename is None:
        raise ModelNotAvailableError(f"No model configured for risk type {risk_type}")
    
    path = ML_MODELS_DIR / filename
    
    if not path.exists():
        raise ModelNotAvailableError(f"Model file not found: {path}")
    
    try:
        return joblib.load(path)
    except (EOFError, pickle.UnpicklingError, AttributeError) as e:
        # Handle corrupted or incompatible model files
        raise ModelNotAvailableError(
            f"Failed to load model {path}: {type(e).__name__} - {e}"
        )

FEATURE_NUMERIC = [
    "Latitude",
    "Longitude",
    "Rainfall (mm)",
    "Temperature (°C)",
    "Humidity (%)",
    "River Discharge (m³/s)",
    "Water Level (m)",
    "Elevation (m)",
    "Population Density",
    "Infrastructure",
    "Historical Floods",
]
FEATURE_CATEGORICAL = [
    "Land Cover",
    "Soil Type",
]


def _build_feature_df(req: PointRiskRequest) -> pd.DataFrame:
    """
    Flood model feature row (matches flood_risk_dataset_india.csv).
    """
    base: Dict[str, Optional[float | str]] = {
        "Latitude": req.latitude,
        "Longitude": req.longitude,
        "Rainfall (mm)": None,
        "Temperature (°C)": None,
        "Humidity (%)": None,
        "River Discharge (m³/s)": None,
        "Water Level (m)": None,
        "Elevation (m)": None,
        "Population Density": None,
        "Infrastructure": None,
        "Historical Floods": None,
        "Land Cover": None,
        "Soil Type": None,
    }

    if req.features: # type: ignore
        for key in base.keys():
            if key in req.features: # type: ignore
                base[key] = req.features[key] # type: ignore

    df = pd.DataFrame([base])
    return df


def _build_cyclone_feature_df(req: PointRiskRequest) -> pd.DataFrame:
    """
    Cyclone model feature row: only lat, lon, year (as used in train_cyclone_model.py).
    """
    current_year = 2025  # later you can derive from incident date
    return pd.DataFrame(
        [
            {
                "Latitude": req.latitude,
                "Longitude": req.longitude,
                "Year": current_year,
            }
        ]
    )


def _build_earthquake_feature_df(req: PointRiskRequest) -> pd.DataFrame:
    """
    Earthquake model feature row: lat, lon, year (as used in train_earthquake_model.py).
    """
    year = 2025  # or from incident date if you add it later
    return pd.DataFrame(
        [
            {
                "Latitude": req.latitude,
                "Longitude": req.longitude,
                "Year": year,
            }
        ]
    )


def predict_point_risk(req: PointRiskRequest) -> PointRiskResponse:
    model = _load_model(req.risk_type)

    if req.risk_type == RiskTypeEnum.FLOOD:
        df = _build_feature_df(req)
    elif req.risk_type == RiskTypeEnum.CYCLONE:
        df = _build_cyclone_feature_df(req)
    elif req.risk_type == RiskTypeEnum.EARTHQUAKE:
        df = _build_earthquake_feature_df(req)
    else:
        raise ModelNotAvailableError(
            f"No model configured for risk type {req.risk_type}"
        )

    proba = model.predict_proba(df)[0, 1]
    proba = max(0.0, min(1.0, float(proba)))

    return PointRiskResponse(
        latitude=req.latitude,
        longitude=req.longitude,
        risk_type=req.risk_type,
        probability=proba,
    )


# ---- Area risk helpers (still only flood-aware for now) ----

class GridRow(TypedDict):
    Latitude: float
    Longitude: float
    Rainfall_mm: Optional[float]
    Temperature_degC: Optional[float]
    Humidity_pct: Optional[float]
    River_Discharge_m3s: Optional[float]
    Water_Level_m: Optional[float]
    Elevation_m: Optional[float]
    Population_Density: Optional[float]
    Infrastructure: Optional[str]
    Historical_Floods: Optional[str]
    Land_Cover: Optional[str]
    Soil_Type: Optional[str]


def _build_area_rows(req: AreaRiskRequest) -> List[Dict[str, Optional[float | str]]]:
    lat_step = (req.max_latitude - req.min_latitude) / max(req.grid_size - 1, 1) # type: ignore
    lon_step = (req.max_longitude - req.min_longitude) / max(req.grid_size - 1, 1) # type: ignore

    rows: List[Dict[str, Optional[float | str]]] = []

    base_features: Dict[str, Optional[float | str]] = {
        "Rainfall (mm)": None,
        "Temperature (°C)": None,
        "Humidity (%)": None,
        "River Discharge (m³/s)": None,
        "Water Level (m)": None,
        "Elevation (m)": None,
        "Population Density": None,
        "Infrastructure": None,
        "Historical Floods": None,
        "Land Cover": None,
        "Soil Type": None,
    }
    # AreaRiskRequest currently has no .features field, so we just reuse NaNs/None.

    for i in range(req.grid_size): # type: ignore
        lat = req.min_latitude + i * lat_step # type: ignore
        for j in range(req.grid_size): # type: ignore
            lon = req.min_longitude + j * lon_step # type: ignore

            row = {
                "Latitude": lat,
                "Longitude": lon,
                **base_features,
            }
            rows.append(row)

    return rows



def predict_area_risk(req: AreaRiskRequest) -> AreaRiskResponse:
    model = _load_model(req.risk_type)

    rows = _build_area_rows(req)
    if not rows:
        return AreaRiskResponse(cells=[]) # type: ignore

    df = pd.DataFrame(rows)
    probs = model.predict_proba(df)[:, 1]
    probs = np.clip(probs.astype(float), 0.0, 1.0)

    cells: List[GridCell] = []
    for row, p in zip(rows, probs):
        cells.append(
            GridCell(
                lat_center=float(row["Latitude"]),  # type: ignore
                lon_center=float(row["Longitude"]),  # type: ignore
                risk_type=req.risk_type, # type: ignore
                probability=float(p), # type: ignore
            )
        )

    return AreaRiskResponse(cells=cells) # type: ignore

# prediction_service.py
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession

class PredictionService:
    """
    Wraps prediction CRUD and model scoring. Inject `prediction_crud` and optional `model`.
    """

    def __init__(self, db: AsyncSession, prediction_crud=None, model=None):
        self.db = db
        self.prediction_crud = prediction_crud
        self.model = model

    async def create(self, pred_in):
        if not self.prediction_crud:
            raise RuntimeError("prediction_crud required")
        return await self.prediction_crud.create(self.db, obj_in=pred_in)

    async def get(self, prediction_id: int) -> Optional[object]:
        if not self.prediction_crud:
            raise RuntimeError("prediction_crud required")
        return await self.prediction_crud.get(self.db, id=prediction_id)

    async def predict(self, features: dict) -> dict:
        if not self.model:
            raise RuntimeError("model not configured")
        # model.predict_proba or model.predict depending on implementation
        return self.model.predict_proba([features])[0]  # adapt to your model API

    async def list_for_location(self, location: str) -> Sequence[object]:
        if not self.prediction_crud:
            raise RuntimeError("prediction_crud required")
        return await self.prediction_crud.list_by_location(self.db, location=location)


# app/services/ml_service.py
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession

class MLService:
    """
    Compatibility wrapper: expose ML methods while delegating to prediction CRUD/model loader.
    Inject `prediction_crud` (CRUDPrediction) and optional `model_loader` if available.
    """

    def __init__(self, db: AsyncSession, prediction_crud=None, model_loader=None):
        self.db = db
        self.prediction_crud = prediction_crud
        self.model_loader = model_loader

    async def create_prediction(self, pred_in):
        if not self.prediction_crud:
            raise RuntimeError("prediction_crud required")
        return await self.prediction_crud.create(self.db, obj_in=pred_in)

    async def get_prediction(self, prediction_id: int):
        if not self.prediction_crud:
            raise RuntimeError("prediction_crud required")
        return await self.prediction_crud.get(self.db, id=prediction_id)

    async def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if not self.model_loader:
            raise RuntimeError("model_loader not configured")
        # adapt to your ModelLoader API; example:
        model = self.model_loader.get_model(features.get("type") or "default")
        scores = model.predict_proba([features]) if hasattr(model, "predict_proba") else model.predict([features])
        return {"scores": scores}

    # convenience alias for code expecting "prediction" service
    async def create(self, *args, **kwargs):
        return await self.create_prediction(*args, **kwargs)