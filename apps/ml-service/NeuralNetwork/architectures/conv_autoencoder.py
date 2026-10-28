"""Convolutional autoencoder for image reconstruction."""
from ._torch import nn

class ConvAutoencoder(nn.Module):
    def __init__(self, input_channels: int = 3):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(input_channels, 32, 3, stride=2, padding=1), nn.ReLU(),
            nn.Conv2d(32, 64, 3, stride=2, padding=1), nn.ReLU(),
            nn.Conv2d(64, 128, 3, stride=2, padding=1), nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(128, 64, 4, stride=2, padding=1), nn.ReLU(),
            nn.ConvTranspose2d(64, 32, 4, stride=2, padding=1), nn.ReLU(),
            nn.ConvTranspose2d(32, input_channels, 4, stride=2, padding=1), nn.Sigmoid(),
        )
    def forward(self, x):
        return self.decoder(self.encoder(x))
