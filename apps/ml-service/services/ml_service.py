
"""Orchestrates supervised ML training and model persistence."""

import json
import os

from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import joblib
import pandas as pd

from machineLearning.supervised.linear_regression import (
    LinearRegressionModel,
)

from machineLearning.supervised.trainer import train_supervised


# --------------------------------------------------
# Model Artifact Storage
# --------------------------------------------------

MODEL_ARTIFACT_DIR = Path(
    os.getenv(
        "MODEL_ARTIFACT_DIR",
        str(Path(__file__).resolve().parents[1] / "artifacts"),
    )
)


def get_model_path(model_id: str) -> Path:
    """Resolve a UUID-based model artifact path."""

    try:
        safe_model_id = str(UUID(model_id))
    except (ValueError, TypeError, AttributeError):
        raise ValueError("Invalid model ID.")

    return MODEL_ARTIFACT_DIR / f"{safe_model_id}.joblib"


def get_schema_path(model_id: str) -> Path:
    """Resolve the corresponding model schema path."""

    artifact_path = get_model_path(model_id)

    return artifact_path.with_suffix(".schema.json")


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
    """
    Train a registered classification or regression algorithm
    and save the resulting model and feature schema.
    """

    if not rows:
        raise ValueError("Dataset cannot be empty.")

    result = train_supervised(
        data=rows,
        target_column=target_column,
        task=task,
        algorithm=algorithm,
        test_size=test_size,
    )

    model_id = str(uuid4())

    MODEL_ARTIFACT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    artifact_path = get_model_path(model_id)
    schema_path = get_schema_path(model_id)

    # Extract the fitted model without returning it in the API response.
    trained_model = result.pop("model")

    # Save the fitted sklearn pipeline.
    joblib.dump(
        trained_model,
        artifact_path,
    )

    # Build schema metadata.
    schema = {
        "model_id": model_id,
        "task": result["task"],
        "algorithm": result["algorithm"],
        "target_column": result["target_column"],
        "features": result["feature_schema"],
    }

    # Save feature schema separately.
    with schema_path.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            schema,
            file,
            indent=2,
        )

    return {
        "success": True,
        "model_id": model_id,
        "algorithm": algorithm,
        "artifact_status": "saved",
        **result,
    }


# --------------------------------------------------
# Model Schema Retrieval
# --------------------------------------------------

def get_model_schema(model_id: str) -> dict[str, Any]:
    """
    Retrieve the feature schema associated with a trained model.

    Supports older model artifacts that do not have a schema file.
    """

    artifact_path = get_model_path(model_id)

    if not artifact_path.is_file():
        raise FileNotFoundError(
            "Trained model not found."
        )

    schema_path = get_schema_path(model_id)

    # New models: read saved schema.
    if schema_path.is_file():

        with schema_path.open(
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    # Older models: attempt to recover feature names.
    model = joblib.load(artifact_path)

    feature_names = getattr(
        model,
        "feature_names_in_",
        [],
    )

    return {
        "model_id": str(UUID(model_id)),
        "features": [
            {
                "name": str(name),
                "type": "string",
                "nullable": True,
            }
            for name in feature_names
        ],
    }


# --------------------------------------------------
# Model Prediction
# --------------------------------------------------

def predict_model(
    model_id: str,
    input_data: dict[str, Any],
) -> dict[str, Any]:
    """Load a trained model and generate a prediction."""

    artifact_path = get_model_path(model_id)

    if not artifact_path.is_file():
        raise FileNotFoundError(
            "Trained model not found."
        )

    if not input_data:
        raise ValueError(
            "Input data cannot be empty."
        )

    # Load trained pipeline.
    model = joblib.load(artifact_path)

    # Convert input into DataFrame.
    input_df = pd.DataFrame([input_data])

    # Generate prediction.
    predictions = model.predict(input_df)

    prediction = predictions[0]

    # Convert NumPy values into JSON-compatible values.
    if hasattr(prediction, "item"):
        prediction = prediction.item()

    return {
        "success": True,
        "model_id": str(UUID(model_id)),
        "prediction": prediction,
    }


# --------------------------------------------------
# Legacy Linear Regression Compatibility
# --------------------------------------------------

class MLService:
    """Compatibility layer for the linear-regression training route."""

    @staticmethod
    def train_linear_regression(
        data,
        target_column,
        test_size=0.2,
    ):
        df = pd.DataFrame(data)

        if target_column not in df.columns:
            raise ValueError(
                "Target column not found"
            )

        X = df.drop(columns=[target_column])
        y = df[target_column]

        if X.empty or not all(
            pd.api.types.is_numeric_dtype(X[col])
            for col in X.columns
        ):
            raise ValueError(
                "Features must be numeric"
            )

        if not pd.api.types.is_numeric_dtype(y):
            raise ValueError(
                "Target must be numeric"
            )

        if df.isnull().any().any():
            raise ValueError(
                "Dataset contains missing values"
            )

        if len(df) < 5:
            raise ValueError(
                "At least 5 rows are required"
            )

        model = LinearRegressionModel()

        return model.train(
            X,
            y,
            test_size=test_size,
        )
