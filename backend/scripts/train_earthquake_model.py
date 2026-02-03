# backend/scripts/train_earthquake_model.py

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parents[1]  # -> backend/
DATA_PATH = BASE_DIR / "Earthquakes.csv"
ML_DIR = BASE_DIR / "ml_models"
ML_DIR.mkdir(exist_ok=True)
MODEL_PATH = ML_DIR / "earthquake_risk.joblib"

# Modelling choices
MAG_THRESHOLD = 4.5       # minimum magnitude to count as impactful
DIST_THRESHOLD_KM = 100.0 # radius around grid cell for impact
LAT_MIN, LAT_MAX, LAT_STEP = 6.0, 36.0, 1.0
LON_MIN, LON_MAX, LON_STEP = 68.0, 98.0, 1.0
MIN_YEAR = 2000           # ignore older events


def load_quakes() -> pd.DataFrame:
    """
    Load and simplify Earthquakes.csv.
    Uses: time, latitude, longitude, mag.
    """
    cols = ["time", "latitude", "longitude", "mag"]
    print(f"Loading earthquakes from {DATA_PATH} ...")
    df = pd.read_csv(DATA_PATH, usecols=cols)

    # Drop rows with missing values
    df = df.dropna(subset=["time", "latitude", "longitude", "mag"])

    # Extract year from ISO time string
    # Example: 2024-10-31T01:32:40.503Z
    df["Year"] = pd.to_datetime(df["time"], errors="coerce").dt.year
    df = df.dropna(subset=["Year"])
    df["Year"] = df["Year"].astype(int)

    df["Latitude"] = df["latitude"].astype(float)
    df["Longitude"] = df["longitude"].astype(float)
    df["Magnitude"] = df["mag"].astype(float)

    # Filter by region & year & magnitude
    df = df[
        (df["Year"] >= MIN_YEAR)
        & (df["Latitude"] >= LAT_MIN)
        & (df["Latitude"] <= LAT_MAX)
        & (df["Longitude"] >= LON_MIN)
        & (df["Longitude"] <= LON_MAX)
        & (df["Magnitude"] >= MAG_THRESHOLD)
    ]

    print(
        f"Earthquakes loaded: {len(df)} events "
        f"from years {df['Year'].min()}–{df['Year'].max()}"
    )
    return df[["Year", "Latitude", "Longitude", "Magnitude"]]


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


def build_training_table(quakes: pd.DataFrame) -> pd.DataFrame:
    """
    Build a table with one row per (grid cell, year):
    - Features: Latitude, Longitude, Year
    - Target: EarthquakeImpact (1 if any quake with mag>=MAG_THRESHOLD
      within DIST_THRESHOLD_KM that year, else 0)
    """
    grid = build_grid()
    years = np.sort(quakes["Year"].unique())

    rows = []
    for year in years:
        year_quakes = quakes[quakes["Year"] == year]
        if year_quakes.empty:
            continue

        q_lat = year_quakes["Latitude"].to_numpy()
        q_lon = year_quakes["Longitude"].to_numpy()

        print(f"Processing year {year} with {len(year_quakes)} earthquakes...")

        for _, cell in grid.iterrows():
            lat_cell = cell["Latitude"]
            lon_cell = cell["Longitude"]

            dists = haversine_km(lat_cell, lon_cell, q_lat, q_lon)
            min_dist = float(dists.min())

            impact = 1 if min_dist <= DIST_THRESHOLD_KM else 0

            rows.append(
                {
                    "Latitude": lat_cell,
                    "Longitude": lon_cell,
                    "Year": int(year),
                    "EarthquakeImpact": impact,
                }
            )

    df = pd.DataFrame(rows)
    print(f"Training rows (grid x year): {len(df)}")
    return df


def main() -> None:
    quakes = load_quakes()
    if quakes.empty:
        print("No earthquakes in selected region/years/magnitude; aborting.")
        return

    df = build_training_table(quakes)

    X = df[["Latitude", "Longitude", "Year"]]
    y = df["EarthquakeImpact"].astype(int)

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

    print("Training earthquake risk model...")
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, proba)
    print(f"Earthquake model AUC: {auc:.3f}")
    print(classification_report(y_test, model.predict(X_test)))

    joblib.dump(model, MODEL_PATH)
    print(f"Saved earthquake model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
