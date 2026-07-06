"""Honest metrics: per-class P/R/F1, macro-F1, confusion, and calibration error.

The paper reported only top-line accuracy on 40 clips. These give the per-class and
calibration picture needed to trust (or distrust) a model in production.
"""

from __future__ import annotations

import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix, f1_score


def compute_metrics(
    y_true: np.ndarray, y_pred: np.ndarray, labels: list[str]
) -> dict:
    idx = list(range(len(labels)))
    report = classification_report(
        y_true, y_pred, labels=idx, target_names=labels, output_dict=True, zero_division=0
    )
    return {
        "accuracy": float((y_true == y_pred).mean()),
        "macro_f1": float(f1_score(y_true, y_pred, labels=idx, average="macro", zero_division=0)),
        "per_class": {lbl: report[lbl] for lbl in labels},
        "confusion": confusion_matrix(y_true, y_pred, labels=idx).tolist(),
    }


def expected_calibration_error(
    probs: np.ndarray, y_true: np.ndarray, n_bins: int = 10
) -> float:
    """ECE: gap between confidence and accuracy, binned by confidence."""
    conf = probs.max(axis=1)
    pred = probs.argmax(axis=1)
    correct = (pred == y_true).astype(np.float64)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    for lo, hi in zip(bins[:-1], bins[1:], strict=True):
        m = (conf > lo) & (conf <= hi)
        if m.any():
            ece += m.mean() * abs(correct[m].mean() - conf[m].mean())
    return float(ece)


class TemperatureScaler(torch.nn.Module):
    """Single-parameter post-hoc calibration. Fit on validation logits."""

    def __init__(self) -> None:
        super().__init__()
        self.log_temp = torch.nn.Parameter(torch.zeros(1))

    @property
    def temperature(self) -> float:
        return float(self.log_temp.detach().exp())

    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        return logits / self.log_temp.exp()

    def fit(
        self, logits: torch.Tensor, targets: torch.Tensor, max_iter: int = 200
    ) -> TemperatureScaler:
        opt = torch.optim.LBFGS([self.log_temp], lr=0.05, max_iter=max_iter)
        nll = torch.nn.CrossEntropyLoss()

        def closure() -> torch.Tensor:
            opt.zero_grad()
            loss = nll(self.forward(logits), targets)
            loss.backward()
            return loss

        opt.step(closure)
        return self
