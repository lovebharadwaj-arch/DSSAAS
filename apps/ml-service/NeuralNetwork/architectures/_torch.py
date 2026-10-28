"""Shared optional PyTorch dependency guard."""
try:
    import torch
    from torch import nn
except ImportError as exc:  # pragma: no cover - environment dependent
    raise ImportError("This architecture requires PyTorch. Install it with: python -m pip install torch") from exc
