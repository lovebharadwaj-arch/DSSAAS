
"""Common supervised training/evaluation entry point."""

from __future__ import annotations

import math

import numpy as np
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from ..preprocessing import make_preprocessor
from .classification import CLASSIFIERS
from .regression import REGRESSORS


def _json_value(value):
    """Convert NumPy and pandas values into JSON-compatible values."""
    if isinstance(value, np.generic):
        value = value.item()

    if pd.isna(value):
        return None

    return value


def _normalize_numeric_features(features: pd.DataFrame) -> pd.DataFrame:
    """
    Convert numeric-looking string columns into numeric columns.

    Example:
        "5.1", "3.5", "1.4" -> 5.1, 3.5, 1.4

    Blank strings are treated as missing values.
    """
    features = features.copy()

    for column in features.columns:
        series = features[column]

        if (
            pd.api.types.is_object_dtype(series)
            or pd.api.types.is_string_dtype(series)
        ):
            # Treat blank strings as missing values.
            cleaned = series.replace(r"^\s*$", np.nan, regex=True)

            non_missing = cleaned.dropna()

            if non_missing.empty:
                features[column] = cleaned
                continue

            converted = pd.to_numeric(cleaned, errors="coerce")

            # Convert only when every non-missing value is numeric.
            if converted.loc[cleaned.notna()].notna().all():
                features[column] = converted
            else:
                features[column] = cleaned

    return features


def _build_feature_schema(features: pd.DataFrame) -> list[dict]:
    """
    Build feature metadata for automatic frontend form generation.
    """
    schema = []

    for column in features.columns:
        series = features[column]

        if pd.api.types.is_bool_dtype(series):
            feature_type = "boolean"

        elif pd.api.types.is_numeric_dtype(series):
            feature_type = "number"

        else:
            feature_type = "category"

        feature = {
            "name": str(column),
            "type": feature_type,
            "nullable": bool(series.isna().any()),
        }

        if feature_type == "category":
            unique_values = series.dropna().unique().tolist()

            # Avoid generating huge dropdowns.
            if len(unique_values) <= 100:
                feature["options"] = [
                    str(value) for value in unique_values
                ]

        schema.append(feature)

    return schema


def train_supervised(
    data,
    target_column: str,
    task: str,
    algorithm: str = "random_forest",
    test_size: float = 0.2,
):
    """Train one classification or regression algorithm on tabular data."""

    if task not in {"classification", "regression"}:
        raise ValueError(
            "task must be 'classification' or 'regression'."
        )

    if not 0.1 <= float(test_size) <= 0.4:
        raise ValueError(
            "test_size must be between 0.1 and 0.4."
        )

    frame = (
        data.copy()
        if isinstance(data, pd.DataFrame)
        else pd.DataFrame(data)
    )

    if frame.empty:
        raise ValueError("The dataset contains no rows.")

    if target_column not in frame.columns:
        raise ValueError(
            f"Target column '{target_column}' was not found."
        )

    frame = frame.dropna(subset=[target_column]).copy()

    if len(frame) < 5:
        raise ValueError(
            "At least 5 rows with a target value are required."
        )

    X = frame.drop(columns=[target_column])
    y = frame[target_column]

    if X.shape[1] == 0:
        raise ValueError(
            "At least one feature column besides the target is required."
        )

    # Convert numeric-looking CSV strings into numeric features.
    X = _normalize_numeric_features(X)

    if task == "classification":

        factory_map = CLASSIFIERS

        if y.nunique() < 2:
            raise ValueError(
                "Classification requires at least two target classes."
            )

        if algorithm not in factory_map:
            raise ValueError(
                f"Unsupported classification algorithm: {algorithm}"
            )

        counts = y.value_counts()

        stratify = y if counts.min() >= 2 else None

        if stratify is not None:
            n_test = math.ceil(len(y) * float(test_size))
            n_train = len(y) - n_test

            if (
                n_test < y.nunique()
                or n_train < y.nunique()
            ):
                stratify = None

        scoring_task = "classification"

    else:

        factory_map = REGRESSORS

        if algorithm not in factory_map:
            raise ValueError(
                f"Unsupported regression algorithm: {algorithm}"
            )

        y = pd.to_numeric(y, errors="coerce")

        valid_target = y.notna()

        X = X.loc[valid_target]
        y = y.loc[valid_target]

        if len(y) < 5:
            raise ValueError(
                "Regression requires at least 5 numeric target values."
            )

        stratify = None
        scoring_task = "regression"

    # Generate schema after all row filtering and feature normalization.
    feature_schema = _build_feature_schema(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=float(test_size),
        random_state=42,
        stratify=stratify,
    )

    # Existing preprocessing pipeline.
    preprocessor = make_preprocessor(
        X_train,
        scale_numeric=True,
    )

    estimator = factory_map[algorithm]()

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", estimator),
        ]
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    # Evaluation metrics.
    if scoring_task == "classification":

        metrics = {
            "accuracy": float(
                accuracy_score(y_test, predictions)
            ),
            "precision_weighted": float(
                precision_score(
                    y_test,
                    predictions,
                    average="weighted",
                    zero_division=0,
                )
            ),
            "recall_weighted": float(
                recall_score(
                    y_test,
                    predictions,
                    average="weighted",
                    zero_division=0,
                )
            ),
            "f1_weighted": float(
                f1_score(
                    y_test,
                    predictions,
                    average="weighted",
                    zero_division=0,
                )
            ),
        }

    else:

        mse = float(
            mean_squared_error(y_test, predictions)
        )

        metrics = {
            "mae": float(
                mean_absolute_error(y_test, predictions)
            ),
            "mse": mse,
            "rmse": float(math.sqrt(mse)),
            "r2": (
                float(r2_score(y_test, predictions))
                if len(y_test) > 1
                else 0.0
            ),
        }

    sample_predictions = [
        {
            "actual": _json_value(actual),
            "predicted": _json_value(predicted),
        }
        for actual, predicted in list(
            zip(y_test.tolist(), predictions.tolist())
        )[:10]
    ]

    return {
        "task": scoring_task,
        "algorithm": algorithm,
        "target_column": target_column,
        "total_rows": int(len(X)),
        "training_rows": int(len(X_train)),
        "testing_rows": int(len(X_test)),
        "metrics": metrics,
        "sample_predictions": sample_predictions,
        "feature_schema": feature_schema,

        # Do not JSON-serialize the fitted model.
        "model": model,
    }
