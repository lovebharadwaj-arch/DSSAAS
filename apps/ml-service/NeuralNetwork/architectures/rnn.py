"""RNN/LSTM/GRU sequence classifier implementations."""
from ._torch import nn

class RecurrentClassifier(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, num_classes: int, kind: str = "lstm", num_layers: int = 1, dropout: float = 0.0):
        super().__init__()
        kind = kind.lower()
        choices = {"rnn": nn.RNN, "lstm": nn.LSTM, "gru": nn.GRU}
        if kind not in choices:
            raise ValueError("kind must be one of: rnn, lstm, gru")
        self.kind = kind
        self.recurrent = choices[kind](input_size, hidden_size, num_layers=num_layers, batch_first=True,
                                       dropout=dropout if num_layers > 1 else 0.0)
        self.classifier = nn.Linear(hidden_size, num_classes)
    def forward(self, x):
        output, state = self.recurrent(x)
        if self.kind == "lstm":
            hidden = state[0][-1]
        else:
            hidden = state[-1]
        return self.classifier(hidden)
