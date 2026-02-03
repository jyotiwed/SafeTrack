from pathlib import Path
from joblib import load

MODEL_PATH = Path(r"C:\Users\jyoti\emergecy\backend\ml_models\flood_risk.joblib")

print("MODEL_PATH:", MODEL_PATH)
print("exists:", MODEL_PATH.exists())
print("size:", MODEL_PATH.stat().st_size)

model = load(MODEL_PATH)
print("Model loaded OK:", type(model))
