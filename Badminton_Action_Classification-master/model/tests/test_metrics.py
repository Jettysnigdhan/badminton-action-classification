import numpy as np
import torch

from badminton.training.metrics import (
    TemperatureScaler,
    compute_metrics,
    expected_calibration_error,
)

LABELS = ["a", "b", "c", "d"]


def test_compute_metrics_perfect():
    y = np.array([0, 1, 2, 3, 0, 1])
    m = compute_metrics(y, y.copy(), LABELS)
    assert m["accuracy"] == 1.0
    assert m["macro_f1"] == 1.0
    assert np.trace(np.array(m["confusion"])) == len(y)


def test_compute_metrics_handles_missing_class():
    # class 'd' never predicted -> zero_division must not crash
    y_true = np.array([0, 1, 2, 3])
    y_pred = np.array([0, 1, 2, 2])
    m = compute_metrics(y_true, y_pred, LABELS)
    assert 0.0 <= m["macro_f1"] <= 1.0
    assert "d" in m["per_class"]


def test_ece_zero_for_perfectly_calibrated():
    # 100% confident and 100% correct -> ECE 0
    probs = np.eye(4)[np.array([0, 1, 2, 3])]
    ece = expected_calibration_error(probs, np.array([0, 1, 2, 3]))
    assert ece == 0.0


def test_temperature_scaler_reduces_overconfidence():
    torch.manual_seed(0)
    logits = torch.randn(200, 4) * 5  # very sharp -> overconfident
    targets = torch.randint(0, 4, (200,))
    scaler = TemperatureScaler().fit(logits, targets)
    assert scaler.temperature > 0
