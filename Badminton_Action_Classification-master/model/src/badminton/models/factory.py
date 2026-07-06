"""Model factory so the training/serving code never hardcodes an architecture.

Adding ST-GCN or a TCN later means registering it here; nothing else changes.
"""

from __future__ import annotations

from torch import nn

from ..config import ModelConfig
from .lstm import BiLSTMAttention
from .stgcn import NUM_NODES, STGCN


def build_model(cfg: ModelConfig, input_dim: int, num_classes: int) -> nn.Module:
    if cfg.name == "bilstm_attn":
        return BiLSTMAttention(
            input_dim=input_dim,
            num_classes=num_classes,
            hidden_size=cfg.hidden_size,
            num_layers=cfg.num_layers,
            dropout=cfg.dropout,
            bidirectional=cfg.bidirectional,
        )
    if cfg.name == "stgcn":
        if input_dim % NUM_NODES != 0:
            raise ValueError(
                f"ST-GCN needs joint-grouped features (input_dim divisible by {NUM_NODES}); "
                f"got {input_dim}. Ensure the dataset uses graph_layout=True."
            )
        return STGCN(
            in_channels=input_dim // NUM_NODES,
            num_classes=num_classes,
            base_channels=cfg.hidden_size,
            dropout=cfg.dropout,
        )
    raise NotImplementedError(
        f"model '{cfg.name}' not yet implemented; available: ['bilstm_attn', 'stgcn']"
    )
