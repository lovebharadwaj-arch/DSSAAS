"""Evaluation helpers for trained tabular neural networks."""
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, mean_squared_error, r2_score


def evaluate_predictions(y_true, y_pred, task: str):
    task = task.lower()
    if task == "classification":
        return {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "f1_weighted": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        }
    if task == "regression":
        return {
            "mae": float(mean_absolute_error(y_true, y_pred)),
            "mse": float(mean_squared_error(y_true, y_pred)),
            "rmse": float(mean_squared_error(y_true, y_pred) ** 0.5),
            "r2": float(r2_score(y_true, y_pred)) if len(y_true) > 1 else None,
        }
    raise ValueError("task must be 'classification' or 'regression'.")
