import torch

from badminton.config import ModelConfig
from badminton.models import build_model


def test_bilstm_forward_shape():
    cfg = ModelConfig(name="bilstm_attn", hidden_size=32, num_layers=2)
    model = build_model(cfg, input_dim=85, num_classes=4)
    x = torch.randn(8, 16, 85)  # [B, T, F]
    out = model(x)
    assert out.shape == (8, 4)


def test_model_is_trainable():
    cfg = ModelConfig(hidden_size=16, num_layers=1)
    model = build_model(cfg, input_dim=20, num_classes=3)
    x = torch.randn(4, 10, 20)
    y = torch.tensor([0, 1, 2, 0])
    loss = torch.nn.functional.cross_entropy(model(x), y)
    loss.backward()
    assert any(p.grad is not None and p.grad.abs().sum() > 0 for p in model.parameters())


def test_stgcn_forward_and_backward():
    cfg = ModelConfig(name="stgcn", hidden_size=16)
    # graph layout: 5 channels/joint * 17 joints = 85
    model = build_model(cfg, input_dim=5 * 17, num_classes=5)
    x = torch.randn(4, 24, 85)  # [B, T, V*C]
    out = model(x)
    assert out.shape == (4, 5)
    loss = torch.nn.functional.cross_entropy(out, torch.tensor([0, 1, 2, 3, 4][:4]))
    loss.backward()
    assert any(p.grad is not None and p.grad.abs().sum() > 0 for p in model.parameters())


def test_stgcn_rejects_non_joint_grouped_dim():
    import pytest

    with pytest.raises(ValueError, match="divisible"):
        build_model(ModelConfig(name="stgcn", hidden_size=16), input_dim=89, num_classes=5)
