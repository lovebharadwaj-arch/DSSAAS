
"""ML training, model persistence, prediction and feature schemas."""

import json
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


def validate_model_id(model_id: str) -> str:
    try:
        return str(UUID(model_id))
    except (ValueError, TypeError, AttributeError):
        raise ValueError("Invalid model ID.")


def get_model_path(model_id: str) -> Path:
    validated_id = validate_model_id(model_id)
    return ARTIFACT_DIR / f"{validated_id}.joblib"


def get_schema_path(model_id: str) -> Path:
    validated_id = validate_model_id(model_id)
    return ARTIFACT_DIR / f"{validated_id}.schema.json"


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

    if not rows:
        raise ValueError("Dataset cannot be empty.")

    result = train_supervised(
        data=pd.DataFrame(rows),
        target_column=target_column,
        task=task,
        algorithm=algorithm,
        test_size=test_size,
    )

    model_id = str(uuid4())

    # Save fitted ML pipeline.
    joblib.dump(result["model"], get_model_path(model_id))

    # Prepare feature schema.
    schema = {
        "model_id": model_id,
        "task": result["task"],
        "algorithm": result["algorithm"],
        "target_column": result["target_column"],
        "features": result["feature_schema"],
    }

    # Save schema JSON.
    with get_schema_path(model_id).open(
        "w", encoding="utf-8"
    ) as file:
        json.dump(schema, file, indent=2, ensure_ascii=False)

    return {
        "success": True,
        "model_id": model_id,
        "task": result["task"],
        "algorithm": result["algorithm"],
        "target_column": result["target_column"],
        "total_rows": result["total_rows"],
        "training_rows": result["training_rows"],
        "testing_rows": result["testing_rows"],
        "metrics": result["metrics"],
        "sample_predictions": result["sample_predictions"],
        "artifact_status": "saved",
    }


# --------------------------------------------------
# Get Model Feature Schema
# --------------------------------------------------

def get_model_schema(model_id: str) -> dict[str, Any]:

    artifact_path = get_model_path(model_id)
    schema_path = get_schema_path(model_id)

    if not artifact_path.is_file():
        raise FileNotFoundError("Trained model not found.")

    if not schema_path.is_file():
        raise FileNotFoundError(
            "Feature schema not found. Retrain this model to generate its schema."
        )

    with schema_path.open("r", encoding="utf-8") as file:
        return json.load(file)


# --------------------------------------------------
# Model Prediction
# --------------------------------------------------

def predict_model(
    model_id: str,
    input_data: dict[str, Any],
) -> dict[str, Any]:

    if not input_data:
        raise ValueError("Input data cannot be empty.")

    artifact_path = get_model_path(model_id)

    if not artifact_path.is_file():
        raise FileNotFoundError("Trained model not found.")

    model = joblib.load(artifact_path)

    input_frame = pd.DataFrame([input_data])
    prediction = model.predict(input_frame)[0]

    if hasattr(prediction, "item"):
        prediction = prediction.item()

    return {
        "success": True,
        "model_id": validate_model_id(model_id),
        "prediction": prediction,
    }

def get_model_artifact_status(model_id: str):
    """
    Check whether a model artifact and its feature schema exist.
    Does not modify or delete any files.
    """

    model_id = validate_model_id(model_id)

    model_path = get_model_path(model_id)
    schema_path = get_schema_path(model_id)

    model_exists = model_path.is_file()
    schema_exists = schema_path.is_file()

    return {
        "success": True,
        "model_id": model_id,
        "artifact": {
            "exists": model_exists,
            "filename": model_path.name if model_exists else None,
            "size_bytes": model_path.stat().st_size if model_exists else None,
        },
        "schema": {
            "exists": schema_exists,
            "filename": schema_path.name if schema_exists else None,
            "size_bytes": schema_path.stat().st_size if schema_exists else None,
        },
        "complete": model_exists and schema_exists,
    }
