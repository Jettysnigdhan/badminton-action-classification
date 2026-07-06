"""Spatial-Temporal Graph Convolutional Network for skeleton action recognition.

Unlike the BiLSTM (which flattens joints and ignores body structure), ST-GCN convolves
over the *skeleton graph* in space and over time, so it exploits which joints are
physically connected. Based on Yan et al. (AAAI 2018), kept compact to suit the modest
dataset size (~460 training clips) and avoid overfitting.

Input contract: the model receives the same ``[B, T, F]`` tensor the rest of the pipeline
produces, where ``F = V * C`` (joint-grouped channels from FeatureExtractor's graph
layout). It reshapes to ``[B, C, T, V]`` internally.
"""

from __future__ import annotations

import numpy as np
import torch
from torch import nn

from .. import COCO17_KEYPOINTS, KEYPOINT_INDEX

NUM_NODES = len(COCO17_KEYPOINTS)  # 17

# COCO-17 skeleton bones (parent-child joint pairs).
_BONES = [
    ("nose", "left_eye"), ("nose", "right_eye"),
    ("left_eye", "left_ear"), ("right_eye", "right_ear"),
    ("nose", "left_shoulder"), ("nose", "right_shoulder"),
    ("left_shoulder", "right_shoulder"),
    ("left_shoulder", "left_elbow"), ("left_elbow", "left_wrist"),
    ("right_shoulder", "right_elbow"), ("right_elbow", "right_wrist"),
    ("left_shoulder", "left_hip"), ("right_shoulder", "right_hip"),
    ("left_hip", "right_hip"),
    ("left_hip", "left_knee"), ("left_knee", "left_ankle"),
    ("right_hip", "right_knee"), ("right_knee", "right_ankle"),
]


def _normalized_adjacency() -> np.ndarray:
    """Symmetric-normalized adjacency with self-loops: D^-1/2 (A+I) D^-1/2."""
    a = np.eye(NUM_NODES, dtype=np.float32)
    for u, v in _BONES:
        iu, iv = KEYPOINT_INDEX[u], KEYPOINT_INDEX[v]
        a[iu, iv] = a[iv, iu] = 1.0
    deg = a.sum(axis=1)
    dinv = np.diag(1.0 / np.sqrt(np.where(deg > 0, deg, 1.0)))
    return (dinv @ a @ dinv).astype(np.float32)


class STGCNBlock(nn.Module):
    """One spatial graph conv + temporal conv, with learnable edge importance + residual."""

    def __init__(self, in_ch: int, out_ch: int, t_kernel: int = 9, t_stride: int = 1,
                 dropout: float = 0.3) -> None:
        super().__init__()
        # spatial: 1x1 conv mixes channels, then aggregate over graph via adjacency.
        self.gconv = nn.Conv2d(in_ch, out_ch, kernel_size=1)
        self.edge_importance = nn.Parameter(torch.ones(NUM_NODES, NUM_NODES))
        # temporal: conv over time only (kernel along T, width 1 over V).
        pad = ((t_kernel - 1) // 2, 0)
        self.tconv = nn.Sequential(
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, (t_kernel, 1), (t_stride, 1), pad),
            nn.BatchNorm2d(out_ch),
            nn.Dropout(dropout),
        )
        if in_ch == out_ch and t_stride == 1:
            self.residual = nn.Identity()
        else:
            self.residual = nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 1, (t_stride, 1)), nn.BatchNorm2d(out_ch)
            )
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        # x: [B, C, T, V]
        res = self.residual(x)
        h = self.gconv(x)  # [B, out, T, V]
        a = adj * self.edge_importance  # learnable per-edge weighting
        h = torch.einsum("bctv,vw->bctw", h, a)  # graph aggregation over joints
        h = self.tconv(h)
        return self.relu(h + res)


class STGCN(nn.Module):
    def __init__(self, in_channels: int, num_classes: int, base_channels: int = 64,
                 dropout: float = 0.3) -> None:
        super().__init__()
        self.in_channels = in_channels
        self.register_buffer("adj", torch.from_numpy(_normalized_adjacency()))
        self.data_bn = nn.BatchNorm1d(in_channels * NUM_NODES)

        c = base_channels
        # Compact 4-block stack; one temporal downsample. Channels: C->c->c->2c->2c.
        self.blocks = nn.ModuleList([
            STGCNBlock(in_channels, c, dropout=dropout),
            STGCNBlock(c, c, dropout=dropout),
            STGCNBlock(c, 2 * c, t_stride=2, dropout=dropout),
            STGCNBlock(2 * c, 2 * c, dropout=dropout),
        ])
        self.head = nn.Linear(2 * c, num_classes)

    def forward(self, x: torch.Tensor, mask: torch.Tensor | None = None) -> torch.Tensor:
        # x: [B, T, F] with F = C * V (joint-grouped) -> [B, C, T, V]
        b, t, f = x.shape
        c = f // NUM_NODES
        x = x.view(b, t, NUM_NODES, c).permute(0, 3, 1, 2).contiguous()  # [B, C, T, V]

        # normalize per joint-channel over the sequence
        x = x.permute(0, 1, 3, 2).reshape(b, c * NUM_NODES, t)
        x = self.data_bn(x)
        x = x.reshape(b, c, NUM_NODES, t).permute(0, 1, 3, 2).contiguous()  # [B, C, T, V]

        for block in self.blocks:
            x = block(x, self.adj)

        x = x.mean(dim=(2, 3))  # global average pool over time + joints -> [B, 2c]
        return self.head(x)
