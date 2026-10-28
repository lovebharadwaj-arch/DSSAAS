"""Tabular MLP classification using scikit-learn."""
from __future__ import annotations
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from ..preprocessing import build_preprocessor


def train_mlp_classifier(data, target_column: str, test_size: float = 0.2, random_state: int = 42,
                         hidden_layer_sizes=(128, 64), max_iter: int = 300):
    """Train an MLP classifier from rows (list[dict] or DataFrame).

    Returns a fitted Pipeline, JSON-friendly metrics, and a small prediction sample.
    """
    frame = data.copy() if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    if target_column not in frame.columns:
        raise ValueError(f"Target column '{target_column}' was not found.")
    frame = frame.dropna(subset=[target_column])
    if len(frame) < 5:
        raise ValueError("At least 5 rows with a target value are required.")
    X = frame.drop(columns=[target_column])
    y = frame[target_column]
    if X.shape[1] == 0:
        raise ValueError("At least one feature column is required.")
    stratify = y if y.nunique() > 1 and y.value_counts().min() >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=stratify
    )
    model = Pipeline([
        ("preprocessor", build_preprocessor(X_train)),
        ("network", MLPClassifier(hidden_layer_sizes=tuple(hidden_layer_sizes), max_iter=max_iter,
                                   early_stopping=len(X_train) >= 30, random_state=random_state)),
    ])
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision_weighted": float(precision_score(y_test, predictions, average="weighted", zero_division=0)),
        "recall_weighted": float(recall_score(y_test, predictions, average="weighted", zero_division=0)),
        "f1_weighted": float(f1_score(y_test, predictions, average="weighted", zero_division=0)),
        "train_rows": int(len(X_train)), "test_rows": int(len(X_test)),
        "classes": [str(value) for value in model.named_steps["network"].classes_],
        "classification_report": classification_report(y_test, predictions, output_dict=True, zero_division=0),
    }
    sample = [{"actual": str(actual), "predicted": str(predicted)} for actual, predicted in zip(y_test.iloc[:20], predictions[:20])]
    return {"model": model, "metrics": metrics, "predictions": sample, "target_column": target_column, "algorithm": "mlp_classifier"}
