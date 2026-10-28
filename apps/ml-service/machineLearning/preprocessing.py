"""Reusable tabular-data preprocessing."""

from __future__ import annotations

import inspect

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def _dense_one_hot_encoder():
    """Support both newer and older scikit-learn OneHotEncoder signatures."""
    parameters = inspect.signature(OneHotEncoder).parameters
    if "sparse_output" in parameters:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    return OneHotEncoder(handle_unknown="ignore", sparse=False)


def make_preprocessor(features: pd.DataFrame, scale_numeric: bool = True):
    """Build a preprocessing transformer from the columns in a feature frame."""
    numeric_columns = features.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_columns = [
        column for column in features.columns if column not in numeric_columns
    ]

    numeric_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))

    transformers = []
    if numeric_columns:
        transformers.append(
            (
                "numeric",
                Pipeline(steps=numeric_steps),
                numeric_columns,
            )
        )
    if categorical_columns:
        transformers.append(
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", _dense_one_hot_encoder()),
                    ]
                ),
                categorical_columns,
            )
        )

    if not transformers:
        raise ValueError("The dataset has no usable feature columns.")

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",
        sparse_threshold=0.0,
    )
