"""Tabular neural networks using TensorFlow/Keras.

This module imports TensorFlow lazily so the rest of the DSSAAS ML service
can start even when TensorFlow is not installed. Inputs are ordinary rows
(records) and a named target column.
"""

from __future__ import annotations

import math
from typing import Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler


def train_tabular_model(
    data,
    target_column: str,
    task: str,
    epochs: int = 30,
    batch_size: int = 32,
    test_size: float = 0.2,
):
    """Train an MLP classifier/regressor. Returns JSON-friendly metrics and model.

    Categorical feature values are one-hot encoded. Missing numeric values are
    filled with training-set medians; missing categorical values use a marker.
    Scaling is fitted only on training data to reduce leakage.
    """
    try:
        import tensorflow as tf
    except ImportError as exc:
        raise RuntimeError(
            "TensorFlow is not installed. Install the deep-learning requirements first."
        ) from exc

    if task not in {"classification", "regression"}:
        raise ValueError("task must be 'classification' or 'regression'.")
    if not 0.1 <= float(test_size) <= 0.4:
        raise ValueError("test_size must be between 0.1 and 0.4.")
    if not 1 <= int(epochs) <= 300:
        raise ValueError("epochs must be between 1 and 300.")
    if not 1 <= int(batch_size) <= 1024:
        raise ValueError("batch_size must be between 1 and 1024.")

    frame = data.copy() if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    if frame.empty or target_column not in frame.columns:
        raise ValueError("Provide non-empty data and a valid target_column.")
    frame = frame.dropna(subset=[target_column]).copy()
    if len(frame) < 10:
        raise ValueError("At least 10 rows with target values are required.")

    X = frame.drop(columns=[target_column]).copy()
    y = frame[target_column].copy()
    if X.shape[1] == 0:
        raise ValueError("At least one feature column besides the target is required.")

    numeric_columns = X.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_columns = [c for c in X.columns if c not in numeric_columns]
    for column in numeric_columns:
        X[column] = pd.to_numeric(X[column], errors="coerce")
    for column in categorical_columns:
        X[column] = X[column].astype("string").fillna("__MISSING__")

    stratify = None
    label_encoder = None
    if task == "classification":
        y = y.astype(str)
        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(y)
        if len(label_encoder.classes_) < 2:
            raise ValueError("Classification requires at least two target classes.")
        class_counts = pd.Series(y_encoded).value_counts()
        if class_counts.min() >= 2:
            test_rows = math.ceil(len(y_encoded) * float(test_size))
            train_rows = len(y_encoded) - test_rows
            if test_rows >= len(label_encoder.classes_) and train_rows >= len(label_encoder.classes_):
                stratify = y_encoded
        y_for_split = y_encoded
    else:
        y_for_split = pd.to_numeric(y, errors="coerce")
        valid = y_for_split.notna()
        X, y_for_split = X.loc[valid], y_for_split.loc[valid]
        if len(y_for_split) < 10:
            raise ValueError("Regression requires at least 10 numeric target values.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_for_split, test_size=float(test_size), random_state=42, stratify=stratify
    )

    # Fit preprocessing only on training rows.
    train_numeric_medians = {}
    for column in numeric_columns:
        median = X_train[column].median()
        if pd.isna(median):
            median = 0.0
        train_numeric_medians[column] = float(median)
        X_train.loc[:, column] = X_train[column].fillna(median)
        X_test.loc[:, column] = X_test[column].fillna(median)

    combined_train = pd.get_dummies(X_train, columns=categorical_columns, dtype=float)
    combined_test = pd.get_dummies(X_test, columns=categorical_columns, dtype=float)
    combined_test = combined_test.reindex(columns=combined_train.columns, fill_value=0)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(combined_train.astype(float))
    X_test_scaled = scaler.transform(combined_test.astype(float))

    tf.keras.utils.set_random_seed(42)
    input_width = X_train_scaled.shape[1]
    if task == "classification":
        class_count = len(label_encoder.classes_)
        output_units = 1 if class_count == 2 else class_count
        output_activation = "sigmoid" if class_count == 2 else "softmax"
        loss = "binary_crossentropy" if class_count == 2 else "sparse_categorical_crossentropy"
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(input_width,)),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(0.25),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dropout(0.15),
            tf.keras.layers.Dense(output_units, activation=output_activation),
        ])
        model.compile(optimizer="adam", loss=loss, metrics=["accuracy"])
        model.fit(
            X_train_scaled, y_train, epochs=int(epochs), batch_size=int(batch_size),
            validation_split=0.1, verbose=0,
            callbacks=[tf.keras.callbacks.EarlyStopping(
                monitor="val_loss", patience=5, restore_best_weights=True
            )],
        )
        probabilities = model.predict(X_test_scaled, verbose=0)
        if class_count == 2:
            predicted_encoded = (probabilities.reshape(-1) >= 0.5).astype(int)
        else:
            predicted_encoded = probabilities.argmax(axis=1)
        from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
        metrics = {
            "accuracy": float(accuracy_score(y_test, predicted_encoded)),
            "precision_weighted": float(precision_score(
                y_test, predicted_encoded, average="weighted", zero_division=0
            )),
            "recall_weighted": float(recall_score(
                y_test, predicted_encoded, average="weighted", zero_division=0
            )),
            "f1_weighted": float(f1_score(
                y_test, predicted_encoded, average="weighted", zero_division=0
            )),
        }
        actual_values = label_encoder.inverse_transform(np.asarray(y_test, dtype=int))
        predicted_values = label_encoder.inverse_transform(predicted_encoded)
    else:
        y_train_array = np.asarray(y_train, dtype=np.float32)
        y_test_array = np.asarray(y_test, dtype=np.float32)
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(input_width,)),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dense(1),
        ])
        model.compile(optimizer="adam", loss="mse", metrics=["mae"])
        model.fit(
            X_train_scaled, y_train_array, epochs=int(epochs), batch_size=int(batch_size),
            validation_split=0.1, verbose=0,
            callbacks=[tf.keras.callbacks.EarlyStopping(
                monitor="val_loss", patience=5, restore_best_weights=True
            )],
        )
        predictions = model.predict(X_test_scaled, verbose=0).reshape(-1)
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
        mse = float(mean_squared_error(y_test_array, predictions))
        metrics = {
            "mae": float(mean_absolute_error(y_test_array, predictions)),
            "mse": mse,
            "rmse": float(math.sqrt(mse)),
            "r2": float(r2_score(y_test_array, predictions)) if len(y_test_array) > 1 else 0.0,
        }
        actual_values = y_test_array
        predicted_values = predictions

    sample_predictions = [
        {"actual": _json_scalar(actual), "predicted": _json_scalar(predicted)}
        for actual, predicted in list(zip(actual_values, predicted_values))[:10]
    ]
    return {
        "task": task,
        "algorithm": "mlp",
        "target_column": target_column,
        "total_rows": int(len(X)),
        "training_rows": int(len(X_train)),
        "testing_rows": int(len(X_test)),
        "epochs_requested": int(epochs),
        "batch_size": int(batch_size),
        "metrics": metrics,
        "sample_predictions": sample_predictions,
        "model": model,
        "preprocessing": {
            "numeric_columns": numeric_columns,
            "categorical_columns": categorical_columns,
            "feature_columns": list(combined_train.columns),
            "numeric_medians": train_numeric_medians,
            "scaler": scaler,
            "label_classes": label_encoder.classes_.tolist() if label_encoder else None,
        },
    }


def _json_scalar(value: Any):
    if isinstance(value, np.generic):
        return value.item()
    if pd.isna(value):
        return None
    return value
