"""Supervised neural network training functions."""
from .classification import train_mlp_classifier
from .regression import train_mlp_regressor

__all__ = ["train_mlp_classifier", "train_mlp_regressor"]
