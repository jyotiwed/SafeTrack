# backend/scripts/train_resource_demand_model.py

from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error


BASE_DIR = Path(__file__).resolve().parents[1]  # -> backend/
ML_DIR = BASE_DIR / "ml_models"
ML_DIR.mkdir(exist_ok=True)
MODEL_PATH = ML_DIR / "resource_demand.joblib"


def _generate_synthetic_data(n_samples: int = 5000, random_state: int = 42):
    rng = np.random.default_rng(random_state)

    # Core inputs
    affected_population = rng.integers(0, 100_000, size=n_samples)
    area_km2 = rng.uniform(0.1, 5_000.0, size=n_samples)

    # Extra numeric feature: severity_score (0–3)
    severity_score = rng.integers(0, 4, size=n_samples)

    # X must match _build_feature_array:
    # [affected_population, area_km2] + sorted(features.keys())
    # Use a single extra key "severity_score" for now.
    X = np.column_stack([affected_population, area_km2, severity_score])

    # Heuristic targets (teams, boats, ambulances)
    # You can tweak these formulas to better reflect your intuition.
    teams = (
        0.0001 * affected_population
        + 0.001 * area_km2
        + 3 * severity_score
        + rng.normal(0, 2, size=n_samples)
    )

    boats = (
        0.00002 * affected_population
        + 0.0005 * area_km2
        + 2 * severity_score
        + rng.normal(0, 1, size=n_samples)
    )

    ambulances = (
        0.00005 * affected_population
        + 0.0003 * area_km2
        + 1.5 * severity_score
        + rng.normal(0, 1.5, size=n_samples)
    )

    # Clip to non-negative
    y = np.column_stack(
        [
            np.clip(teams, 0, None),
            np.clip(boats, 0, None),
            np.clip(ambulances, 0, None),
        ]
    )

    return X, y


def main() -> None:
    X, y = _generate_synthetic_data()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred, multioutput="uniform_average")
    mae = mean_absolute_error(y_test, y_pred, multioutput="uniform_average")
    print(f"Resource model R2: {r2:.3f}, MAE: {mae:.3f}")

    joblib.dump(model, MODEL_PATH)
    print(f"Saved resource demand model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
