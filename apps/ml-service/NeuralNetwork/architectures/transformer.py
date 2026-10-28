"""Transformer encoder for already-tokenized sequence features."""
from ._torch import nn

class TransformerClassifier(nn.Module):
    def __init__(self, input_size: int, num_classes: int, d_model: int = 128, nhead: int = 4,
                 num_layers: int = 2, dropout: float = 0.1):
        super().__init__()
        if d_model % nhead:
            raise ValueError("d_model must be divisible by nhead.")
        self.projection = nn.Linear(input_size, d_model)
        layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, dropout=dropout, batch_first=True)
        self.encoder = nn.TransformerEncoder(layer, num_layers=num_layers)
        self.classifier = nn.Linear(d_model, num_classes)
    def forward(self, x, padding_mask=None):
        x = self.projection(x)
        encoded = self.encoder(x, src_key_padding_mask=padding_mask)
        if padding_mask is None:
            pooled = encoded.mean(dim=1)
        else:
            valid = (~padding_mask).unsqueeze(-1).to(encoded.dtype)
            pooled = (encoded * valid).sum(dim=1) / valid.sum(dim=1).clamp_min(1)
        return self.classifier(pooled)
