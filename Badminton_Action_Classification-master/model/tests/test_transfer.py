import torch

from badminton.config import ModelConfig
from badminton.models import build_model
from badminton.training.transfer import freeze_backbone, load_backbone


def _save(model, path):
    torch.save({"model_state": model.state_dict()}, path)


def test_backbone_transfers_head_reinitializes(tmp_path):
    # Pretrained model has 8 classes; target has 5 -> head shape differs, must reinit.
    src = build_model(ModelConfig(hidden_size=32, num_layers=1), input_dim=85, num_classes=8)
    ckpt = tmp_path / "pre.pt"
    _save(src, ckpt)

    tgt = build_model(ModelConfig(hidden_size=32, num_layers=1), input_dim=85, num_classes=5)
    # capture head + a backbone tensor before transfer
    head_before = tgt.head[-1].weight.detach().clone()
    info = load_backbone(tgt, str(ckpt))

    assert info["loaded"] > 0
    assert info["skipped_head"] > 0
    # a backbone tensor now equals the source
    assert torch.allclose(tgt.lstm.weight_ih_l0, src.lstm.weight_ih_l0)
    # head was NOT overwritten (still its own init, shape 5)
    assert tgt.head[-1].weight.shape[0] == 5
    assert torch.allclose(tgt.head[-1].weight, head_before)


def test_transfer_across_architectures_is_partial(tmp_path):
    # ST-GCN source into ST-GCN target with different classes
    src = build_model(ModelConfig(name="stgcn", hidden_size=16), input_dim=85, num_classes=10)
    ckpt = tmp_path / "stgcn.pt"
    _save(src, ckpt)
    tgt = build_model(ModelConfig(name="stgcn", hidden_size=16), input_dim=85, num_classes=5)
    info = load_backbone(tgt, str(ckpt))
    assert info["loaded"] > 0
    assert info["loaded"] + info["skipped_head"] + info["skipped_mismatch"] == info["total"]


def test_freeze_backbone_leaves_head_trainable():
    model = build_model(ModelConfig(hidden_size=16, num_layers=1), input_dim=85, num_classes=5)
    freeze_backbone(model)
    head_trainable = [p.requires_grad for n, p in model.named_parameters() if n.startswith("head")]
    backbone_trainable = [
        p.requires_grad for n, p in model.named_parameters() if not n.startswith("head")
    ]
    assert all(head_trainable)
    assert not any(backbone_trainable)
