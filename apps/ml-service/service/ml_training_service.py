from typing import Any

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


def train_model(
    rows: list[dict[str, Any]],
    target_column: str,
    task: str,
    test_size: float = 0.2,
) -> dict[str, Any]:
    if not rows:
        raise ValueError("Dataset cannot be empty.")

    if not 0.1 <= test_size <= 0.4:
        raise ValueError("Test size must be between 0.1 and 0.4.")

    df = pd.DataFrame(rows)

    if target_column not in df.columns:
        raise ValueError("Target column does not exist.")

    # Remove rows without a target value.
    df = df.dropna(subset=[target_column])

    if len(df) < 10:
        raise ValueError("At least 10 usable rows are required.")

    X = df.drop(columns=[target_column])
    y = df[target_column]

    if X.shape[1] == 0:
        raise ValueError("Dataset must contain input features.")

    if task == "classification":
        if y.nunique() < 2:
            raise ValueError("Classification needs at least two classes.")

        if y.value_counts().min() < 2:
            raise ValueError(
                "Each class needs at least two examples for this split."
            )

        model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight="balanced",
        )

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=42,
            stratify=y,
        )

    elif task == "regression":
        if not pd.api.types.is_numeric_dtype(y):
            raise ValueError(
                "Regression requires a numeric target column."
            )

        model = RandomForestRegressor(
            n_estimators=100,
            random_state=42,
        )

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=42,
        )

    else:
        raise ValueError(
            "Task must be classification or regression."
        )

    numeric_columns = X.select_dtypes(
        include="number"
    ).columns.tolist()

    categorical_columns = [
        column
        for column in X.columns
        if column not in numeric_columns
    ]

    preprocessing = ColumnTransformer(
        transformers=[
            (
                "numeric",
                SimpleImputer(strategy="median"),
                numeric_columns,
            ),
            (
                "categorical",
                Pipeline([
                    (
                        "imputer",
                        SimpleImputer(strategy="most_frequent"),
                    ),
                    (
                        "encoder",
                        OneHotEncoder(handle_unknown="ignore"),
                    ),
                ]),
                categorical_columns,
            ),
        ],
        remainder="drop",
    )

    pipeline = Pipeline([
        ("preprocessing", preprocessing),
        ("model", model),
    ])

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)

    if task == "classification":
        metrics = {
            "accuracy": round(
                float(accuracy_score(y_test, predictions)), 4
            ),
            "f1_weighted": round(
                float(
                    f1_score(
                        y_test,
                        predictions,
                        average="weighted",
                        zero_division=0,
                    )
                ),
                4,
            ),
        }
    else:
        metrics = {
            "mae": round(
                float(mean_absolute_error(y_test, predictions)), 4
            ),
            "r2": round(float(r2_score(y_test, predictions)), 4),
        }

    return {
        "task": task,
        "algorithm": "random_forest",
        "target_column": target_column,
        "total_rows": len(df),
        "training_rows": len(X_train),
        "testing_rows": len(X_test),
        "metrics": metrics,
        "sample_predictions": [
            {
                "actual": actual,
                "predicted": predicted,
            }
            for actual, predicted in zip(
                y_test.head(10).tolist(),
                predictions[:10].tolist(),
            )
        ],
    }
