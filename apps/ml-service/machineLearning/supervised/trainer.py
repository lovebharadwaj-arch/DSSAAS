
"""Common supervised training and evaluation entry point.

This module provides a shared training pipeline for:
    1. Classification algorithms
    2. Regression algorithms

Responsibilities:
    - Validate training configuration and dataset.
    - Separate features (X) and target (y).
    - Normalize numeric-looking feature columns.
    - Validate classification and regression targets.
    - Generate feature schemas for prediction forms.
    - Split training and testing datasets.
    - Build preprocessing and model pipelines.
    - Train and evaluate the selected algorithm.
    - Return metrics, predictions, schema and fitted model.
"""

from __future__ import annotations

import math
import warnings

import numpy as np
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    explained_variance_score,
    f1_score,
    mean_absolute_error,
    mean_absolute_percentage_error,
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


# ============================================================
# 1. Convert NumPy and Pandas values into JSON-compatible data
# ============================================================

def _json_value(value):
    """Convert NumPy and pandas values into JSON-compatible values."""

    if isinstance(value, np.generic):
        value = value.item()

    if pd.isna(value):
        return None

    return value


# ============================================================
# 2. Normalize numeric-looking feature columns
# ============================================================

def _normalize_numeric_features(
    features: pd.DataFrame,
) -> pd.DataFrame:
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

            cleaned = series.replace(
                r"^\s*$",
                np.nan,
                regex=True,
            )

            non_missing = cleaned.dropna()

            if non_missing.empty:
                features[column] = cleaned
                continue

            converted = pd.to_numeric(
                cleaned,
                errors="coerce",
            )

            if converted.loc[cleaned.notna()].notna().all():
                features[column] = converted
            else:
                features[column] = cleaned

    return features


# ============================================================
# 3. Build feature schema for automatic prediction forms
# ============================================================

def _build_feature_schema(
    features: pd.DataFrame,
) -> list[dict]:
    """
    Generate feature metadata for frontend prediction forms.

    Supported feature types:
        - number
        - boolean
        - category
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

            if len(unique_values) <= 100:

                feature["options"] = [
                    str(value)
                    for value in unique_values
                ]

        schema.append(feature)

    return schema


# ============================================================
# 4. Validate classification target
# ============================================================

def _validate_classification_target(y: pd.Series) -> None:
    """
    Validate a classification target.

    Classification targets must contain at least two classes.
    """

    unique_classes = y.nunique()

    if unique_classes < 2:

        raise ValueError(
            "Classification requires at least two target classes."
        )

    if pd.api.types.is_numeric_dtype(y):

        unique_ratio = unique_classes / len(y)

        if unique_ratio > 0.5:

            warnings.warn(
                (
                    "The target contains a high number of unique "
                    "numeric values. Verify that you selected the "
                    "correct task. This may be a regression problem."
                ),
                UserWarning,
                stacklevel=2,
            )


# ============================================================
# 5. Validate regression target
# ============================================================

def _validate_regression_target(y: pd.Series) -> pd.Series:
    """
    Validate and normalize a regression target.

    Non-numeric, NaN and infinite target values are removed.
    """

    numeric_target = pd.to_numeric(
        y,
        errors="coerce",
    )

    valid_target = (
        numeric_target.notna()
        & np.isfinite(numeric_target)
    )

    numeric_target = numeric_target.loc[valid_target]

    if len(numeric_target) < 5:

        raise ValueError(
            "Regression requires at least 5 valid numeric target values."
        )

    if numeric_target.nunique() < 2:

        raise ValueError(
            "Regression requires at least two different target values."
        )

    return numeric_target


# ============================================================
# 6. Regression algorithm-specific target validation
# ============================================================

def _validate_regression_algorithm_target(
    y: pd.Series,
    algorithm: str,
) -> None:
    """
    Validate target requirements for specialized regressors.

    Poisson:
        Target must be non-negative.

    Gamma:
        Target must be strictly positive.

    Tweedie with power=1.5:
        Target must be non-negative.
    """

    target_values = pd.to_numeric(
        y,
        errors="coerce",
    )

    if (
        not target_values.notna().all()
        or not np.isfinite(target_values).all()
    ):

        raise ValueError(
            "Regression target must contain only finite numeric values."
        )

    if algorithm == "poisson":

        if (target_values < 0).any():

            raise ValueError(
                "Poisson regression requires non-negative target values."
            )

    elif algorithm == "gamma":

        if (target_values <= 0).any():

            raise ValueError(
                "Gamma regression requires strictly positive target values."
            )

    elif algorithm == "tweedie":

        if (target_values < 0).any():

            raise ValueError(
                "Tweedie regression with power=1.5 requires "
                "non-negative target values."
            )


# ============================================================
# 7. Classification evaluation
# ============================================================

def _evaluate_classification(
    y_test: pd.Series,
    predictions: np.ndarray,
) -> dict:
    """Calculate classification evaluation metrics."""

    return {
        "accuracy": float(
            accuracy_score(
                y_test,
                predictions,
            )
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


# ============================================================
# 8. Regression evaluation
# ============================================================

def _evaluate_regression(
    y_test: pd.Series,
    predictions: np.ndarray,
    model: Pipeline,
    X_train: pd.DataFrame,
) -> dict:
    """
    Calculate regression evaluation metrics.

    Metrics:
        - MAE
        - MSE
        - RMSE
        - R2
        - Adjusted R2
        - Explained Variance
        - MAPE

    MAPE excludes zero-valued actual targets.
    """

    # --------------------------------------------------------
    # Basic regression metrics
    # --------------------------------------------------------

    mse = float(
        mean_squared_error(
            y_test,
            predictions,
        )
    )

    mae = float(
        mean_absolute_error(
            y_test,
            predictions,
        )
    )

    rmse = float(
        math.sqrt(mse)
    )

    r2 = (
        float(
            r2_score(
                y_test,
                predictions,
            )
        )
        if len(y_test) > 1
        else None
    )

    explained_variance = float(
        explained_variance_score(
            y_test,
            predictions,
        )
    )

    # --------------------------------------------------------
    # Adjusted R-squared
    # --------------------------------------------------------

    # Count features after preprocessing and encoding.
    transformed_feature_count = int(
        model.named_steps["preprocessor"]
        .transform(X_train.iloc[:1])
        .shape[1]
    )

    sample_count = len(y_test)

    if (
        r2 is not None
        and sample_count > transformed_feature_count + 1
    ):

        adjusted_r2 = float(
            1 - (
                (1 - r2)
                * (sample_count - 1)
                / (
                    sample_count
                    - transformed_feature_count
                    - 1
                )
            )
        )

    else:

        adjusted_r2 = None

    # --------------------------------------------------------
    # Mean Absolute Percentage Error
    # --------------------------------------------------------

    actual_values = y_test.to_numpy(
        dtype=float,
    )

    predicted_values = np.asarray(
        predictions,
        dtype=float,
    )

    # MAPE is undefined when actual values are zero.
    nonzero_mask = np.abs(actual_values) > 1e-8

    if nonzero_mask.any():

        mape_percentage = float(
            mean_absolute_percentage_error(
                actual_values[nonzero_mask],
                predicted_values[nonzero_mask],
            ) * 100
        )

    else:

        mape_percentage = None

    # --------------------------------------------------------
    # Return regression metrics
    # --------------------------------------------------------

    return {
        "mae": mae,
        "mse": mse,
        "rmse": rmse,
        "r2": r2,
        "adjusted_r2": adjusted_r2,
        "explained_variance": explained_variance,
        "mape_percentage": mape_percentage,
        "mape_excluded_zero_targets": int(
            (~nonzero_mask).sum()
        ),
    }


# ============================================================
# 9. Main supervised training function
# ============================================================

def train_supervised(
    data,
    target_column: str,
    task: str,
    algorithm: str = "random_forest",
    test_size: float = 0.2,
):
    """
    Train and evaluate a supervised machine learning algorithm.

    Parameters:
        data:
            Pandas DataFrame or list of dictionaries.

        target_column:
            Column that the model should predict.

        task:
            classification or regression.

        algorithm:
            Algorithm identifier from CLASSIFIERS or REGRESSORS.

        test_size:
            Percentage of rows used for testing.

    Returns:
        Dictionary containing model, metrics, predictions,
        feature schema and dataset information.
    """

    # --------------------------------------------------------
    # Step 1: Validate training configuration
    # --------------------------------------------------------

    if task not in {"classification", "regression"}:

        raise ValueError(
            "task must be 'classification' or 'regression'."
        )

    try:

        test_size = float(test_size)

    except (TypeError, ValueError):

        raise ValueError(
            "test_size must be a valid number."
        )

    if not 0.1 <= test_size <= 0.4:

        raise ValueError(
            "test_size must be between 0.1 and 0.4."
        )

    # --------------------------------------------------------
    # Step 2: Convert input data into a DataFrame
    # --------------------------------------------------------

    frame = (
        data.copy()
        if isinstance(data, pd.DataFrame)
        else pd.DataFrame(data)
    )

    if frame.empty:

        raise ValueError(
            "The dataset contains no rows."
        )

    if target_column not in frame.columns:

        raise ValueError(
            f"Target column '{target_column}' was not found."
        )

    # --------------------------------------------------------
    # Step 3: Remove rows with missing target values
    # --------------------------------------------------------

    frame = frame.dropna(
        subset=[target_column]
    ).copy()

    if len(frame) < 5:

        raise ValueError(
            "At least 5 rows with a target value are required."
        )

    # --------------------------------------------------------
    # Step 4: Separate features and target
    # --------------------------------------------------------

    X = frame.drop(
        columns=[target_column]
    )

    y = frame[target_column]

    if X.shape[1] == 0:

        raise ValueError(
            "At least one feature column besides the target is required."
        )

    # --------------------------------------------------------
    # Step 5: Normalize feature columns
    # --------------------------------------------------------

    X = _normalize_numeric_features(X)

    # --------------------------------------------------------
    # Step 6: Select task and validate target
    # --------------------------------------------------------

    if task == "classification":

        factory_map = CLASSIFIERS

        _validate_classification_target(y)

        if algorithm not in factory_map:

            raise ValueError(
                f"Unsupported classification algorithm: {algorithm}"
            )

        counts = y.value_counts()

        # Preserve class proportions when possible.
        stratify = (
            y
            if counts.min() >= 2
            else None
        )

        if stratify is not None:

            n_test = math.ceil(
                len(y) * test_size
            )

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

        # Convert target values into numeric values.
        numeric_target = pd.to_numeric(
            y,
            errors="coerce",
        )

        # Remove non-numeric, NaN and infinite target rows.
        valid_target = (
            numeric_target.notna()
            & np.isfinite(numeric_target)
        )

        X = X.loc[valid_target]

        y = _validate_regression_target(
            y.loc[valid_target]
        )

        # Validate specialized regression algorithms.
        _validate_regression_algorithm_target(
            y,
            algorithm,
        )

        stratify = None

        scoring_task = "regression"

    # --------------------------------------------------------
    # Step 7: Validate final dataset
    # --------------------------------------------------------

    if len(X) != len(y):

        raise ValueError(
            "Feature and target row counts do not match."
        )

    if len(X) < 5:

        raise ValueError(
            "At least 5 valid rows are required for training."
        )

    # --------------------------------------------------------
    # Step 8: Generate feature schema
    # --------------------------------------------------------

    feature_schema = _build_feature_schema(X)

    # --------------------------------------------------------
    # Step 9: Split training and testing datasets
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=42,
        stratify=stratify,
    )

    # --------------------------------------------------------
    # Step 10: Build preprocessing pipeline
    # --------------------------------------------------------

    preprocessor = make_preprocessor(
        X_train,
        scale_numeric=True,
    )

    # --------------------------------------------------------
    # Step 11: Create selected ML algorithm
    # --------------------------------------------------------

    estimator = factory_map[algorithm]()

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", estimator),
        ]
    )

    # --------------------------------------------------------
    # Step 12: Train the model
    # --------------------------------------------------------

    model.fit(
        X_train,
        y_train,
    )

    # --------------------------------------------------------
    # Step 13: Generate predictions
    # --------------------------------------------------------

    predictions = model.predict(X_test)

    # --------------------------------------------------------
    # Step 14: Calculate evaluation metrics
    # --------------------------------------------------------

    if scoring_task == "classification":

        metrics = _evaluate_classification(
            y_test,
            predictions,
        )

    else:

        metrics = _evaluate_regression(
            y_test,
            predictions,
            model,
            X_train,
        )

    # --------------------------------------------------------
    # Step 15: Store sample predictions
    # --------------------------------------------------------

    sample_predictions = [
        {
            "actual": _json_value(actual),
            "predicted": _json_value(predicted),
        }

        for actual, predicted in list(
            zip(
                y_test.tolist(),
                predictions.tolist(),
            )
        )[:10]
    ]

    # --------------------------------------------------------
    # Step 16: Return complete training result
    # --------------------------------------------------------

    return {
        "task": scoring_task,
        "algorithm": algorithm,
        "target_column": target_column,

        # Dataset statistics.
        "total_rows": int(len(X)),
        "training_rows": int(len(X_train)),
        "testing_rows": int(len(X_test)),

        # Evaluation results.
        "metrics": metrics,
        "sample_predictions": sample_predictions,

        # Used for automatic prediction forms.
        "feature_schema": feature_schema,

        # The fitted model is saved by ml_training_service.py.
        # Do not JSON-serialize this object.
        "model": model,
    }
