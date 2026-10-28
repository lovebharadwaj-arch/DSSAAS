"""Preprocessing helpers for tabular neural networks."""
from __future__ import annotations
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def build_preprocessor(frame: pd.DataFrame) -> ColumnTransformer:
    """Build a preprocessing pipeline; fit it only on training data."""
    numeric = frame.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical = [column for column in frame.columns if column not in numeric]
    transformers = []
    if numeric:
        numeric_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])
        transformers.append(("numeric", numeric_pipeline, numeric))
    if categorical:
        categorical_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ])
        transformers.append(("categorical", categorical_pipeline, categorical))
    if not transformers:
        raise ValueError("The dataset must contain at least one feature column.")
    return ColumnTransformer(transformers=transformers, remainder="drop")
