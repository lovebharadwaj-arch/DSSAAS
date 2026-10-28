"""Modular deep-learning utilities for the DSSAAS ML service."""

from .registry import DEEP_LEARNING_REGISTRY, get_deep_learning_algorithms
from .tabular import train_tabular_model

__all__ = [
    "DEEP_LEARNING_REGISTRY",
    "get_deep_learning_algorithms",
    "train_tabular_model",
]
