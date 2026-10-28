"""Dimensionality-reduction algorithms."""

from __future__ import annotations

import pandas as pd
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.preprocessing import StandardScaler

from ..preprocessing import make_preprocessor


def reduce_dimensions(data, algorithm: str = "pca", n_components: int = 2):
    frame = data.copy() if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    if frame.empty or frame.shape[1] == 0:
        raise ValueError("Provide a non-empty dataset.")
    if not 1 <= int(n_components) <= min(20, len(frame), max(1, frame.shape[1])):
        raise ValueError("n_components must be positive and cannot exceed dataset dimensions.")

    transformed = make_preprocessor(frame, scale_numeric=True).fit_transform(frame)
    if algorithm == "pca":
        reducer = PCA(n_components=int(n_components), random_state=42)
        result = reducer.fit_transform(transformed)
        explained_variance = [float(v) for v in reducer.explained_variance_ratio_.tolist()]
    elif algorithm == "truncated_svd":
        reducer = TruncatedSVD(n_components=int(n_components), random_state=42)
        result = reducer.fit_transform(transformed)
        explained_variance = [float(v) for v in reducer.explained_variance_ratio_.tolist()]
    else:
        raise ValueError(f"Unsupported dimensionality-reduction algorithm: {algorithm}")

    return {
        "algorithm": algorithm,
        "n_components": int(n_components),
        "explained_variance_ratio": explained_variance,
        "rows": [
            {"row_index": int(i), "components": [float(v) for v in row]}
            for i, row in enumerate(result[:100].tolist())
        ],
    }
