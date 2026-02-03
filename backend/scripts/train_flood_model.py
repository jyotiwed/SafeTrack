from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parents[1]  # backend/
DATA_PATH = BASE_DIR / "flood_risk_dataset_india.csv"
ML_DIR = BASE_DIR / "ml_models"
ML_DIR.mkdir(exist_ok=True)
MODEL_PATH = ML_DIR / "flood_risk.joblib"

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

TARGET_COL = "Flood Occurred"


def main() -> None:
    df = pd.read_csv(DATA_PATH)

    X = df[FEATURE_NUMERIC + FEATURE_CATEGORICAL].copy()
    y = df[TARGET_COL].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, FEATURE_NUMERIC),
            ("cat", categorical_transformer, FEATURE_CATEGORICAL),
        ],
        remainder="drop",
    )

    clf = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=300,
                    max_depth=None,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    clf.fit(X_train, y_train)

    proba = clf.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, proba)
    print(f"Flood model AUC: {auc:.3f}")
    print(classification_report(y_test, clf.predict(X_test)))

    joblib.dump(clf, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
