# app/services/ml_service.py

import math
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, TypedDict

import joblib
import numpy as np
import pandas as pd

from app.schemas.prediction import (
    RiskType,
    PointRiskRequest,
    PointRiskResponse,
    AreaRiskRequest,
    AreaRiskResponse,
    GridCell,
)

BASE_DIR = Path(__file__).resolve().parents[2]  # -> backend/
ML_MODELS_DIR = BASE_DIR / "ml_models"


class ModelNotAvailableError(Exception):
    pass


@lru_cache
def _load_model(risk_type: RiskType):
    filename = {
        RiskType.FLOOD: "flood_risk.joblib",
        RiskType.CYCLONE: "cyclone_risk.joblib",
        RiskType.EARTHQUAKE: "earthquake_risk.joblib",
    }.get(risk_type)
    if filename is None:
        raise ModelNotAvailableError(f"No model configured for risk type {risk_type}")

    path = ML_MODELS_DIR / filename
    if not path.exists():
        raise ModelNotAvailableError(f"Model file not found: {path}")

    return joblib.load(path)


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

    if req.features:
        for key in base.keys():
            if key in req.features:
                base[key] = req.features[key]

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

    if req.risk_type == RiskType.FLOOD:
        df = _build_feature_df(req)
    elif req.risk_type == RiskType.CYCLONE:
        df = _build_cyclone_feature_df(req)
    elif req.risk_type == RiskType.EARTHQUAKE:
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
    lat_step = (req.max_latitude - req.min_latitude) / max(req.grid_size - 1, 1)
    lon_step = (req.max_longitude - req.min_longitude) / max(req.grid_size - 1, 1)

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

    for i in range(req.grid_size):
        lat = req.min_latitude + i * lat_step
        for j in range(req.grid_size):
            lon = req.min_longitude + j * lon_step

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
        return AreaRiskResponse(cells=[])

    df = pd.DataFrame(rows)
    probs = model.predict_proba(df)[:, 1]
    probs = np.clip(probs.astype(float), 0.0, 1.0)

    cells: List[GridCell] = []
    for row, p in zip(rows, probs):
        cells.append(
            GridCell(
                lat_center=float(row["Latitude"]),  # type: ignore
                lon_center=float(row["Longitude"]),  # type: ignore
                risk_type=req.risk_type,
                probability=float(p),
            )
        )

    return AreaRiskResponse(cells=cells)
