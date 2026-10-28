"""Catalog of supported and optional neural-network architectures."""

ALGORITHM_CATALOG = {
    "tabular": {
        "mlp_classifier": {"name": "MLP Classifier", "task": "classification", "backend": "scikit-learn", "implemented": True},
        "mlp_regressor": {"name": "MLP Regressor", "task": "regression", "backend": "scikit-learn", "implemented": True},
    },
    "computer_vision": {
        "cnn": {"name": "Convolutional Neural Network", "task": "image_classification", "backend": "pytorch", "implemented": True},
        "autoencoder_2d": {"name": "Convolutional Autoencoder", "task": "image_reconstruction", "backend": "pytorch", "implemented": True},
    },
    "sequence": {
        "rnn": {"name": "Recurrent Neural Network", "task": "sequence_modeling", "backend": "pytorch", "implemented": True},
        "lstm": {"name": "Long Short-Term Memory", "task": "sequence_modeling", "backend": "pytorch", "implemented": True},
        "gru": {"name": "Gated Recurrent Unit", "task": "sequence_modeling", "backend": "pytorch", "implemented": True},
    },
    "text": {
        "transformer_encoder": {"name": "Transformer Encoder", "task": "sequence_classification", "backend": "pytorch", "implemented": True},
    },
}


def get_algorithm_catalog():
    """Return a copy of the catalog, suitable for an API response."""
    return {group: {key: dict(value) for key, value in items.items()} for group, items in ALGORITHM_CATALOG.items()}
