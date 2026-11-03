from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import joblib
import pandas as pd

from machineLearning.supervised.trainer import train_supervised


# --------------------------------------------------
# Model Artifact Storage
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = BASE_DIR / "artifacts"

ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


def get_model_path(model_id: str) -> Path:
    """
    Resolve a model ID to its artifact file.
    Only UUID-based filenames are accepted.
    """
    try:
        validated_id = str(UUID(model_id))
    except (ValueError, TypeError, AttributeError):
        raise ValueError("Invalid model ID.")

    return ARTIFACT_DIR / f"{validated_id}.joblib"


# --------------------------------------------------
# Model Training
# --------------------------------------------------

def train_model(
    rows: list[dict[str, Any]],
    target_column: str,
    task: str,
    algorithm: str = "random_forest",
    test_size: float = 0.2,
) -> dict[str, Any]:

    # Train using the existing ML training engine.
    result = train_supervised(
        data=pd.DataFrame(rows),
        target_column=target_column,
        task=task,
        algorithm=algorithm,
        test_size=test_size,
    )

    # Generate a unique model ID.
    model_id = str(uuid4())

    # Save the fitted pipeline.
    artifact_path = get_model_path(model_id)

    joblib.dump(result["model"], artifact_path)

    # Return only JSON-serializable information.
    return {
        "model_id": model_id,
        "task": result["task"],
        "algorithm": result["algorithm"],
        "target_column": result["target_column"],
        "total_rows": result["total_rows"],
        "training_rows": result["training_rows"],
        "testing_rows": result["testing_rows"],
        "metrics": result["metrics"],
        "sample_predictions": result["sample_predictions"],
    }


# --------------------------------------------------
# Model Prediction
# --------------------------------------------------

def predict_model(
    model_id: str,
    input_data: dict[str, Any],
) -> dict[str, Any]:

    artifact_path = get_model_path(model_id)

    if not artifact_path.is_file():
        raise FileNotFoundError("Trained model was not found.")

    model = joblib.load(artifact_path)

    input_frame = pd.DataFrame([input_data])

    prediction = model.predict(input_frame)

    return {
        "model_id": str(UUID(model_id)),
        "prediction": prediction[0].item()
        if hasattr(prediction[0], "item")
        else prediction[0],
    }
