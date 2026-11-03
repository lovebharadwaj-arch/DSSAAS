
"""Service for standalone linear regression operations."""

from typing import Any

import pandas as pd

from machineLearning.supervised.linear_regression import LinearRegressionModel


class MLService:

    @staticmethod
    def train_linear_regression(
        data: list[dict[str, Any]],
        target_column: str,
        test_size: float = 0.2,
    ) -> dict[str, Any]:

        if not data:
            raise ValueError("Dataset cannot be empty.")

        if not 0.1 <= test_size <= 0.4:
            raise ValueError("test_size must be between 0.1 and 0.4.")

        frame = pd.DataFrame(data)

        if target_column not in frame.columns:
            raise ValueError(f"Target column '{target_column}' does not exist.")

        if len(frame) < 5:
            raise ValueError("At least 5 rows are required.")

        X = frame.drop(columns=[target_column])
        y = frame[target_column]

        # Linear regression requires numeric features.
        X = X.apply(pd.to_numeric, errors="coerce")
        y = pd.to_numeric(y, errors="coerce")

        # Remove rows containing invalid or missing values.
        valid_rows = X.notna().all(axis=1) & y.notna()

        X = X.loc[valid_rows]
        y = y.loc[valid_rows]

        if len(X) < 5:
            raise ValueError(
                "At least 5 valid rows are required after removing missing values."
            )

        if X.shape[1] == 0:
            raise ValueError("At least one feature column is required.")

        model = LinearRegressionModel()

        result = model.train(
            X=X,
            y=y,
            test_size=test_size,
        )

        return {
            "algorithm": "linear_regression",
            "target_column": target_column,
            "total_rows": len(frame),
            "valid_rows": len(X),
            "metrics": result["metrics"],
            "predictions": result["predictions"],
            "actual": result["actual"],
        }

