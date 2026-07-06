import numpy as np
import torch

from badminton.config import Config
from badminton.features.keypoints import FeatureExtractor
from badminton.inference.pose import StubPoseEstimator
from badminton.inference.predictor import ActionPredictor
from badminton.models import build_model

CFG_DICT = {
    "data": {
        "manifest_path": "x.jsonl",
        "labels": ["backhand_drive", "backhand_net_shot", "forehand_clear", "forehand_drive"],
        "sequence_length": 16,
    }
}


def _predictor(threshold=0.0):
    cfg = Config(**CFG_DICT)
    fe = FeatureExtractor(min_confidence=cfg.data.min_confidence)
    model = build_model(cfg.model, fe.feature_dim(), cfg.num_classes)
    return ActionPredictor(model, fe, cfg, temperature=1.0, threshold=threshold)


def test_predict_returns_valid_distribution():
    p = _predictor()
    kp = StubPoseEstimator(seq_len=20).estimate(np.empty((20, 8, 8, 3)))
    r = p.predict(kp)
    assert r.label in CFG_DICT["data"]["labels"]
    assert abs(sum(r.probabilities.values()) - 1.0) < 1e-4
    assert 0.0 <= r.confidence <= 1.0


def test_abstain_threshold_triggers():
    # threshold above any 4-class confidence floor (0.25) but plausible -> force abstain
    p = _predictor(threshold=0.99)
    kp = StubPoseEstimator(seq_len=16).estimate(np.empty((16, 8, 8, 3)))
    assert p.predict(kp).abstain is True


def test_checkpoint_roundtrip(tmp_path):
    p = _predictor()
    ckpt = tmp_path / "m.pt"
    torch.save(
        {"model_state": p.model.state_dict(), "config": p.cfg.model_dump(), "temperature": 1.0},
        ckpt,
    )
    loaded = ActionPredictor.from_checkpoint(str(ckpt))
    kp = StubPoseEstimator(seq_len=16).estimate(np.empty((16, 8, 8, 3)))
    assert loaded.predict(kp).label in CFG_DICT["data"]["labels"]


def test_player_selection_picks_highest_motion():
    still = np.ones((10, 17, 3), dtype=np.float32)
    mover = np.ones((10, 17, 3), dtype=np.float32)
    mover[:, :, :2] += np.linspace(0, 50, 10)[:, None, None]
    chosen = StubPoseEstimator.select_player({0: still, 1: mover})
    assert np.allclose(chosen, mover)
