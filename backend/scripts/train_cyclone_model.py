# backend/scripts/train_cyclone_model.py

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parents[1]  # -> backend/
DATA_PATH = BASE_DIR / "ibtracs.NI.list.v04r00.csv"
ML_DIR = BASE_DIR / "ml_models"
ML_DIR.mkdir(exist_ok=True)
MODEL_PATH = ML_DIR / "cyclone_risk.joblib"

# Modelling choices
DIST_THRESHOLD_KM = 200.0
LAT_MIN, LAT_MAX, LAT_STEP = 6.0, 36.0, 1.0
LON_MIN, LON_MAX, LON_STEP = 68.0, 98.0, 1.0
MIN_YEAR = 1950  # ignore very old years for speed


def load_tracks() -> pd.DataFrame:
    """
    Load and simplify IBTrACS North Indian Ocean track data.
    Uses only SEASON (Year), LAT, LON.
    """
    cols = ["SEASON", "LAT", "LON"]
    print(f"Loading tracks from {DATA_PATH} ...")
    df = pd.read_csv(DATA_PATH, usecols=cols)

    # Drop obvious non-data rows: SEASON == 'Year' or similar strings
    df = df[df["SEASON"] != "Year"]

    # Drop rows with missing values
    df = df.dropna(subset=["SEASON", "LAT", "LON"])

    # Coerce SEASON to numeric, drop any remaining non-numeric
    df["SEASON"] = pd.to_numeric(df["SEASON"], errors="coerce")
    df = df.dropna(subset=["SEASON"])

    df["Year"] = df["SEASON"].astype(int)
    df["Latitude"] = df["LAT"].astype(float)
    df["Longitude"] = df["LON"].astype(float)

    # Restrict to recent years for tractable training
    df = df[df["Year"] >= MIN_YEAR]

    print(
        f"Tracks loaded: {len(df)} points from years "
        f"{df['Year'].min()}–{df['Year'].max()}"
    )
    return df[["Year", "Latitude", "Longitude"]]



def build_grid() -> pd.DataFrame:
    """
    Build a 1° × 1° grid over India region.
    """
    lat_vals = np.arange(LAT_MIN, LAT_MAX + 1e-6, LAT_STEP)
    lon_vals = np.arange(LON_MIN, LON_MAX + 1e-6, LON_STEP)

    rows = []
    for lat in lat_vals:
        for lon in lon_vals:
            rows.append({"Latitude": float(lat), "Longitude": float(lon)})

    grid = pd.DataFrame(rows)
    print(f"Grid cells: {len(grid)} (lat {LAT_MIN}-{LAT_MAX}, lon {LON_MIN}-{LON_MAX})")
    return grid


def haversine_km(lat1, lon1, lat2, lon2):
    """
    Vectorized haversine distance in km between (lat1, lon1) and arrays lat2, lon2.
    lat1, lon1: scalars; lat2, lon2: numpy arrays.
    """
    R = 6371.0  # Earth radius km

    lat1 = np.radians(lat1)
    lon1 = np.radians(lon1)
    lat2 = np.radians(lat2)
    lon2 = np.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        np.sin(dlat / 2.0) ** 2
        + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0) ** 2
    )
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c


def build_training_table(tracks: pd.DataFrame) -> pd.DataFrame:
    """
    Build a table with one row per (grid cell, year):
    - Features: Latitude, Longitude, Year
    - Target: CycloneImpact (1 if any track point within DIST_THRESHOLD_KM that year)
    """
    grid = build_grid()
    years = np.sort(tracks["Year"].unique())

    rows = []
    for year in years:
        year_tracks = tracks[tracks["Year"] == year]
        if year_tracks.empty:
            continue

        track_lat = year_tracks["Latitude"].to_numpy()
        track_lon = year_tracks["Longitude"].to_numpy()

        print(f"Processing year {year} with {len(year_tracks)} track points...")

        for _, cell in grid.iterrows():
            lat_cell = cell["Latitude"]
            lon_cell = cell["Longitude"]

            dists = haversine_km(lat_cell, lon_cell, track_lat, track_lon)
            min_dist = float(dists.min())

            impact = 1 if min_dist <= DIST_THRESHOLD_KM else 0

            rows.append(
                {
                    "Latitude": lat_cell,
                    "Longitude": lon_cell,
                    "Year": int(year),
                    "CycloneImpact": impact,
                }
            )

    df = pd.DataFrame(rows)
    print(f"Training rows (grid x year): {len(df)}")
    return df


def main() -> None:
    tracks = load_tracks()
    df = build_training_table(tracks)

    X = df[["Latitude", "Longitude", "Year"]]
    y = df["CycloneImpact"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        random_state=42,
        n_jobs=-1,
    )

    print("Training cyclone risk model...")
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, proba)
    print(f"Cyclone model AUC: {auc:.3f}")
    print(classification_report(y_test, model.predict(X_test)))

    joblib.dump(model, MODEL_PATH)
    print(f"Saved cyclone model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
