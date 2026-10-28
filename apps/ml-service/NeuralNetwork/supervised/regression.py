"""Tabular MLP regression using scikit-learn."""
from __future__ import annotations
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
from sklearn.pipeline import Pipeline
from ..preprocessing import build_preprocessor


def train_mlp_regressor(data, target_column: str, test_size: float = 0.2, random_state: int = 42,
                        hidden_layer_sizes=(128, 64), max_iter: int = 300):
    """Train an MLP regressor from rows (list[dict] or DataFrame)."""
    frame = data.copy() if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    if target_column not in frame.columns:
        raise ValueError(f"Target column '{target_column}' was not found.")
    frame[target_column] = pd.to_numeric(frame[target_column], errors="coerce")
    frame = frame.dropna(subset=[target_column])
    if len(frame) < 5:
        raise ValueError("At least 5 rows with a numeric target value are required.")
    X = frame.drop(columns=[target_column])
    y = frame[target_column]
    if X.shape[1] == 0:
        raise ValueError("At least one feature column is required.")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
    model = Pipeline([
        ("preprocessor", build_preprocessor(X_train)),
        ("network", MLPRegressor(hidden_layer_sizes=tuple(hidden_layer_sizes), max_iter=max_iter,
                                 early_stopping=len(X_train) >= 30, random_state=random_state)),
    ])
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    metrics = {
        "mae": float(mean_absolute_error(y_test, predictions)),
        "mse": float(mean_squared_error(y_test, predictions)),
        "rmse": float(mean_squared_error(y_test, predictions) ** 0.5),
        "r2": float(r2_score(y_test, predictions)) if len(y_test) > 1 else None,
        "train_rows": int(len(X_train)), "test_rows": int(len(X_test)),
    }
    sample = [{"actual": float(actual), "predicted": float(predicted)} for actual, predicted in zip(y_test.iloc[:20], predictions[:20])]
    return {"model": model, "metrics": metrics, "predictions": sample, "target_column": target_column, "algorithm": "mlp_regressor"}
