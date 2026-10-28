"""Small reusable PyTorch training loop for tensor datasets."""
from __future__ import annotations

def train_torch_model(model, train_loader, loss_fn, optimizer, epochs: int = 10, device: str = "cpu", validation_loader=None):
    """Train a model using batches (inputs, targets); returns history and model.

    Classification models should return logits and use CrossEntropyLoss. Autoencoders
    can use inputs as targets with MSELoss. Input tensors are moved to `device`.
    """
    import torch
    if epochs < 1:
        raise ValueError("epochs must be at least 1.")
    model = model.to(device)
    history = {"train_loss": [], "validation_loss": []}
    for _ in range(epochs):
        model.train()
        total, count = 0.0, 0
        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad(set_to_none=True)
            outputs = model(inputs)
            loss = loss_fn(outputs, targets)
            loss.backward()
            optimizer.step()
            batch = inputs.size(0)
            total += loss.item() * batch
            count += batch
        history["train_loss"].append(total / max(count, 1))
        if validation_loader is not None:
            model.eval()
            val_total, val_count = 0.0, 0
            with torch.no_grad():
                for inputs, targets in validation_loader:
                    inputs, targets = inputs.to(device), targets.to(device)
                    loss = loss_fn(model(inputs), targets)
                    batch = inputs.size(0)
                    val_total += loss.item() * batch
                    val_count += batch
            history["validation_loss"].append(val_total / max(val_count, 1))
    return {"model": model, "history": history}
