"""Modular machine-learning algorithms for the DSSAAS FastAPI service."""

from .registry import ALGORITHM_REGISTRY, get_algorithms
from .supervised import train_supervised
from .unsupervised import run_clustering, reduce_dimensions

__all__ = [
    "ALGORITHM_REGISTRY",
    "get_algorithms",
    "train_supervised",
    "run_clustering",
    "reduce_dimensions",
]
