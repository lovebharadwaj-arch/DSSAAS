"""Clustering algorithms for tabular datasets."""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering, DBSCAN, KMeans, MiniBatchKMeans
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from ..preprocessing import make_preprocessor

CLUSTERERS = {
    "kmeans": lambda n: KMeans(n_clusters=n, n_init=10, random_state=42),
    "mini_batch_kmeans": lambda n: MiniBatchKMeans(n_clusters=n, random_state=42, n_init=10),
    "dbscan": lambda n: DBSCAN(),  # n_clusters is not used by DBSCAN.
    "agglomerative": lambda n: AgglomerativeClustering(n_clusters=n),
    "gaussian_mixture": lambda n: GaussianMixture(n_components=n, random_state=42),
}


def run_clustering(data, algorithm: str = "kmeans", n_clusters: int = 3):
    frame = data.copy() if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    if frame.empty or frame.shape[1] == 0:
        raise ValueError("Provide a non-empty dataset for clustering.")
    if algorithm not in CLUSTERERS:
        raise ValueError(f"Unsupported clustering algorithm: {algorithm}")
    if not 2 <= int(n_clusters) <= 20:
        raise ValueError("n_clusters must be between 2 and 20.")
    if algorithm in {"kmeans", "mini_batch_kmeans", "agglomerative", "gaussian_mixture"}:
        if len(frame) < int(n_clusters):
            raise ValueError("n_clusters cannot exceed the number of rows.")

    preprocessor = make_preprocessor(frame, scale_numeric=True)
    transformed = preprocessor.fit_transform(frame)
    if not np.isfinite(transformed).all():
        raise ValueError("The preprocessed data contains non-finite values.")

    clusterer = CLUSTERERS[algorithm](int(n_clusters))
    if algorithm == "gaussian_mixture":
        clusterer.fit(transformed)
        labels = clusterer.predict(transformed)
    else:
        labels = clusterer.fit_predict(transformed)

    unique_labels = set(labels.tolist())
    score = None
    # Silhouette score is undefined for one cluster or when every row is its own cluster.
    if 1 < len(unique_labels) < len(labels):
        try:
            score = float(silhouette_score(transformed, labels))
        except ValueError:
            score = None

    return {
        "algorithm": algorithm,
        "total_rows": int(len(frame)),
        "cluster_count": int(len(unique_labels - {-1})),
        "noise_points": int((labels == -1).sum()) if algorithm == "dbscan" else 0,
        "silhouette_score": score,
        "assignments": [
            {"row_index": int(index), "cluster": int(label)}
            for index, label in enumerate(labels[:100].tolist())
        ],
    }
