"""BiLSTM with temporal attention.

Right-sized replacement for the paper's 5x128 stacked LSTM. On a few hundred training
sequences, 2 bidirectional layers with attention pooling generalize far better than a
deep stack, which memorizes. Attention also yields interpretable per-frame importance.
"""

from __future__ import annotations

import torch
from torch import nn


class TemporalAttention(nn.Module):
    """Additive attention pooling over time, returns a context vector."""

    def __init__(self, dim: int) -> None:
        super().__init__()
        self.score = nn.Sequential(nn.Linear(dim, dim // 2), nn.Tanh(), nn.Linear(dim // 2, 1))

    def forward(self, x: torch.Tensor, mask: torch.Tensor | None = None) -> torch.Tensor:
        # x: [B, T, D]
        logits = self.score(x).squeeze(-1)  # [B, T]
        if mask is not None:
            logits = logits.masked_fill(~mask, float("-inf"))
        weights = torch.softmax(logits, dim=1).unsqueeze(-1)  # [B, T, 1]
        return (x * weights).sum(dim=1)  # [B, D]


class BiLSTMAttention(nn.Module):
    def __init__(
        self,
        input_dim: int,
        num_classes: int,
        hidden_size: int = 128,
        num_layers: int = 2,
        dropout: float = 0.3,
        bidirectional: bool = True,
    ) -> None:
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=bidirectional,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        out_dim = hidden_size * (2 if bidirectional else 1)
        self.norm = nn.LayerNorm(out_dim)
        self.attn = TemporalAttention(out_dim)
        self.head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(out_dim, out_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(out_dim // 2, num_classes),
        )

    def forward(self, x: torch.Tensor, mask: torch.Tensor | None = None) -> torch.Tensor:
        seq, _ = self.lstm(x)  # [B, T, out_dim]
        seq = self.norm(seq)
        pooled = self.attn(seq, mask)
        return self.head(pooled)  # logits [B, C]
