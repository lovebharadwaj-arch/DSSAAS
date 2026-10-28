"""A configurable fully connected PyTorch network."""
from ._torch import nn

class MLP(nn.Module):
    def __init__(self, input_size: int, output_size: int, hidden_sizes=(128, 64), dropout: float = 0.2):
        super().__init__()
        if input_size < 1 or output_size < 1:
            raise ValueError("input_size and output_size must be positive.")
        layers = []
        current = input_size
        for width in hidden_sizes:
            layers.extend([nn.Linear(current, width), nn.ReLU()])
            if dropout > 0:
                layers.append(nn.Dropout(dropout))
            current = width
        layers.append(nn.Linear(current, output_size))
        self.network = nn.Sequential(*layers)
    def forward(self, x):
        return self.network(x)
