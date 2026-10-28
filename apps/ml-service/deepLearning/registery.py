"""Catalog of supported deep-learning model architectures."""

DEEP_LEARNING_REGISTRY = {
    "tabular": {
        "mlp_classifier": "Feed-forward Neural Network (Classification)",
        "mlp_regressor": "Feed-forward Neural Network (Regression)",
    },
    "computer_vision": {
        "cnn_classifier": "Convolutional Neural Network (CNN)",
        "transfer_learning": "Transfer Learning (ResNet / MobileNet)",
        "autoencoder": "Convolutional Autoencoder",
    },
    "sequence": {
        "lstm": "Long Short-Term Memory (LSTM)",
        "gru": "Gated Recurrent Unit (GRU)",
        "temporal_cnn": "Temporal Convolutional Network (basic 1D CNN)",
    },
    "text": {
        "text_classifier": "Neural Text Classifier (Embedding + BiLSTM)",
        "transformer_encoder": "Transformer Encoder",
    },
    "representation_learning": {
        "autoencoder": "Dense Autoencoder",
        "variational_autoencoder": "Variational Autoencoder (advanced extension)",
    },
}


def get_deep_learning_algorithms():
    """Return a JSON-friendly list of model IDs and display names."""
    return {
        category: [
            {"id": model_id, "name": name}
            for model_id, name in models.items()
        ]
        for category, models in DEEP_LEARNING_REGISTRY.items()
    }
