import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib


BASE_DIR = Path(__file__).resolve().parents[1]  # -> backend/
ML_DIR = BASE_DIR / "ml_models"
ML_DIR.mkdir(exist_ok=True)

# Optional: if later you have a real CSV, change this path and load it
INCIDENT_CSV = BASE_DIR / "incident_severity_dataset.csv"


def generate_synthetic_incident_data(n_samples: int = 3000) -> pd.DataFrame:
    """
    Synthetic dataset to get a working model.
    Columns:
      - incident_type: {flood, cyclone, fire, building_collapse}
      - latitude, longitude
      - affected_population, area_km2
      - label: severity {low, moderate, high, critical}
    """
    rng = np.random.default_rng(42)

    incident_types = np.array(["flood", "cyclone", "fire", "building_collapse"])
    incident_type = rng.choice(incident_types, size=n_samples)

    lat = rng.uniform(8.0, 37.0, size=n_samples)
    lon = rng.uniform(68.0, 97.0, size=n_samples)

    affected_population = rng.integers(0, 50000, size=n_samples)
    area_km2 = rng.uniform(0.1, 200.0, size=n_samples)

    # Synthetic severity rule
    severity_score = (
        0.5 * (affected_population / 50000.0)
        + 0.3 * (area_km2 / 200.0)
        + 0.2 * rng.normal(0, 0.2, size=n_samples)
    )

    labels = []
    for s in severity_score:
        if s < 0.25:
            labels.append("low")
        elif s < 0.5:
            labels.append("moderate")
        elif s < 0.75:
            labels.append("high")
        else:
            labels.append("critical")

    df = pd.DataFrame(
        {
            "incident_type": incident_type,
            "latitude": lat,
            "longitude": lon,
            "affected_population": affected_population,
            "area_km2": area_km2,
            "severity": labels,
        }
    )
    return df


def main():
    # For now always use synthetic data; replace with real CSV later if available.
    df = generate_synthetic_incident_data()

    X = df[
        [
            "incident_type",
            "latitude",
            "longitude",
            "affected_population",
            "area_km2",
        ]
    ]
    y = df["severity"]

    categorical_features = ["incident_type"]
    numeric_features = ["latitude", "longitude", "affected_population", "area_km2"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numeric_features),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        n_jobs=-1,
    )

    clf = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    clf.fit(X_train, y_train)

    print("Incident severity model:")
    print(classification_report(y_test, clf.predict(X_test)))

    out_path = ML_DIR / "incident_severity.joblib"
    joblib.dump(clf, out_path)
    print(f"Saved incident severity model to {out_path}")


if __name__ == "__main__":
    main()
