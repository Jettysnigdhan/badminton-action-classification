"""Inference: pluggable pose estimation + the action Predictor."""

from .pose import PoseEstimator, RTMPoseEstimator, StubPoseEstimator
from .predictor import ActionPredictor, PredictionResult

__all__ = [
    "PoseEstimator",
    "RTMPoseEstimator",
    "StubPoseEstimator",
    "ActionPredictor",
    "PredictionResult",
]
