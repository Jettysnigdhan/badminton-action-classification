"""End-to-end predictor: keypoints -> features -> calibrated class.

Keeps the model + feature extractor + label space + temperature together so serving
loads one artifact and applies the exact transforms used at train time.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import torch

from ..config import Config
from ..data import sampling
from ..features.keypoints import FeatureExtractor
from ..models import build_model


@dataclass
class PredictionResult:
    label: str
    confidence: float
    probabilities: dict[str, float]
    abstain: bool  # True if below the decision threshold


class ActionPredictor:
    def __init__(
        self,
        model: torch.nn.Module,
        extractor: FeatureExtractor,
        cfg: Config,
        temperature: float = 1.0,
        threshold: float = 0.5,
        device: str = "cpu",
    ) -> None:
        self.model = model.to(device).eval()
        self.extractor = extractor
        self.cfg = cfg
        self.temperature = max(temperature, 1e-3)
        self.threshold = threshold
        self.device = device

    @classmethod
    def from_checkpoint(cls, path: str, device: str = "cpu") -> ActionPredictor:
        ckpt = torch.load(path, map_location=device)
        cfg = Config(**ckpt["config"])
        extractor = FeatureExtractor(
            center_joint=cfg.features.center_joint,
            scale=cfg.features.scale,
            rotate_align=cfg.features.rotate_align,
            use_velocity=cfg.features.use_velocity,
            use_bone_angles=cfg.features.use_bone_angles,
            emit_validity_flag=cfg.features.emit_validity_flag,
            min_confidence=cfg.data.min_confidence,
            graph_layout=cfg.model.name == "stgcn",
        )
        model = build_model(cfg.model, extractor.feature_dim(), cfg.num_classes)
        model.load_state_dict(ckpt["model_state"])
        return cls(model, extractor, cfg, ckpt.get("temperature", 1.0), device=device)

    @torch.no_grad()
    def predict(self, keypoints: np.ndarray) -> PredictionResult:
        """keypoints: [num_frames, 17, 3] (x, y, confidence)."""
        idx = sampling.sample(keypoints, self.cfg.data.sequence_length, self.cfg.data.sampling)
        feats = self.extractor(keypoints[idx])
        x = torch.from_numpy(feats).unsqueeze(0).to(self.device)
        logits = self.model(x) / self.temperature
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
        top = int(probs.argmax())
        conf = float(probs[top])
        return PredictionResult(
            label=self.cfg.data.labels[top],
            confidence=conf,
            probabilities={
                lbl: float(p) for lbl, p in zip(self.cfg.data.labels, probs, strict=True)
            },
            abstain=conf < self.threshold,
        )
