"""Dense autoencoder for numeric feature reconstruction."""
from ._torch import nn

class Autoencoder(nn.Module):
    def __init__(self, input_size: int, latent_size: int = 16):
        super().__init__()
        if input_size < 1 or latent_size < 1:
            raise ValueError("input_size and latent_size must be positive.")
        self.encoder = nn.Sequential(nn.Linear(input_size, max(latent_size * 2, 8)), nn.ReLU(), nn.Linear(max(latent_size * 2, 8), latent_size))
        self.decoder = nn.Sequential(nn.Linear(latent_size, max(latent_size * 2, 8)), nn.ReLU(), nn.Linear(max(latent_size * 2, 8), input_size))
    def forward(self, x):
        return self.decoder(self.encoder(x))
    def encode(self, x):
        return self.encoder(x)
