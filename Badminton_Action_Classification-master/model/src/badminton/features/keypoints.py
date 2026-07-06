"""Turn raw AlphaPose keypoints into a camera-invariant, kinematic feature tensor.

This is the single most important departure from the paper. The paper fed raw pixel
``(x, y, confidence)`` straight into the LSTM, so the model keys on *where the player
stands in the frame*. Here we make features invariant to translation and scale (and
optionally orientation), then add velocities and bone angles that encode *motion*.

All functions operate on numpy arrays of shape ``[T, 17, 3]`` (x, y, confidence).
"""

from __future__ import annotations

import numpy as np

from .. import KEYPOINT_INDEX, LR_FLIP_PAIRS

_LSHO, _RSHO = KEYPOINT_INDEX["left_shoulder"], KEYPOINT_INDEX["right_shoulder"]
_LHIP, _RHIP = KEYPOINT_INDEX["left_hip"], KEYPOINT_INDEX["right_hip"]

# (joint, parent) pairs whose interior angle at `joint` is informative for shots.
_ANGLE_TRIPLETS = [
    ("left_shoulder", "left_elbow", "left_wrist"),
    ("right_shoulder", "right_elbow", "right_wrist"),
    ("left_hip", "left_knee", "left_ankle"),
    ("right_hip", "right_knee", "right_ankle"),
]


def clean_keypoints(kp: np.ndarray, min_confidence: float) -> np.ndarray:
    """Mask low-confidence joints and linearly interpolate them over time.

    Returns ``[T, 17, 3]`` where masked joints are filled along the time axis. The
    confidence channel is preserved (callers decide whether to keep or replace it).
    """
    kp = kp.astype(np.float32).copy()
    T, J, _ = kp.shape
    valid = kp[..., 2] >= min_confidence  # [T, J]
    for j in range(J):
        col_valid = valid[:, j]
        if col_valid.all():
            continue
        if not col_valid.any():
            kp[:, j, :2] = 0.0  # joint never seen; leave at origin post-centering
            continue
        idx = np.arange(T)
        good = idx[col_valid]
        for c in (0, 1):
            kp[:, j, c] = np.interp(idx, good, kp[good, j, c])
    return kp


def _pelvis(kp: np.ndarray) -> np.ndarray:
    return 0.5 * (kp[:, _LHIP, :2] + kp[:, _RHIP, :2])  # [T, 2]


def _torso_length(kp: np.ndarray) -> np.ndarray:
    mid_shoulder = 0.5 * (kp[:, _LSHO, :2] + kp[:, _RSHO, :2])
    pelvis = _pelvis(kp)
    return np.linalg.norm(mid_shoulder - pelvis, axis=1)  # [T]


def mirror(kp: np.ndarray, image_width: float = 1.0) -> np.ndarray:
    """Horizontal mirror + left/right joint swap. Valid handedness augmentation."""
    out = kp.copy()
    out[..., 0] = image_width - out[..., 0]
    for a, b in LR_FLIP_PAIRS:
        ia, ib = KEYPOINT_INDEX[a], KEYPOINT_INDEX[b]
        out[:, [ia, ib]] = out[:, [ib, ia]]
    return out


class FeatureExtractor:
    """Stateless transform from raw keypoints to a model-ready ``[T, F]`` tensor."""

    def __init__(
        self,
        center_joint: str = "pelvis",
        scale: str = "torso",
        rotate_align: bool = False,
        use_velocity: bool = True,
        use_bone_angles: bool = True,
        emit_validity_flag: bool = True,
        min_confidence: float = 0.3,
        graph_layout: bool = False,
    ) -> None:
        self.center_joint = center_joint
        self.scale = scale
        self.rotate_align = rotate_align
        self.use_velocity = use_velocity
        self.use_bone_angles = use_bone_angles
        self.emit_validity_flag = emit_validity_flag
        self.min_confidence = min_confidence
        # graph_layout emits joint-grouped per-joint channels [T, V*C] for graph models
        # (ST-GCN). Bone angles are global (not per-joint) so they are omitted in this mode.
        self.graph_layout = graph_layout

    def channels_per_joint(self) -> int:
        c = 2  # x, y
        if self.emit_validity_flag:
            c += 1
        if self.use_velocity:
            c += 2
        return c

    def feature_dim(self) -> int:
        if self.graph_layout:
            return 17 * self.channels_per_joint()
        dim = 17 * 2  # normalized x, y
        if self.emit_validity_flag:
            dim += 17
        if self.use_velocity:
            dim += 17 * 2
        if self.use_bone_angles:
            dim += len(_ANGLE_TRIPLETS)
        return dim

    def __call__(self, kp_raw: np.ndarray) -> np.ndarray:
        validity = (kp_raw[..., 2] >= self.min_confidence).astype(np.float32)  # [T,17]
        kp = clean_keypoints(kp_raw, self.min_confidence)
        xy = kp[..., :2].copy()  # [T, 17, 2]

        # 1. translation invariance: center on pelvis.
        center = _pelvis(kp)[:, None, :]
        xy = xy - center

        # 2. scale invariance.
        if self.scale == "torso":
            s = _torso_length(kp)
            s = np.where(s < 1e-6, 1.0, s)[:, None, None]
            xy = xy / s
        elif self.scale == "bbox":
            span = xy.max(axis=1, keepdims=True) - xy.min(axis=1, keepdims=True)
            span = np.where(span < 1e-6, 1.0, span)
            xy = xy / span

        # 3. optional rotation alignment (shoulders horizontal).
        if self.rotate_align:
            xy = self._rotate_align(xy)

        vel = None
        if self.use_velocity:
            vel = np.zeros_like(xy)
            vel[1:] = xy[1:] - xy[:-1]

        # Graph layout: joint-grouped channels [T, V, C] -> flat [T, V*C], so a graph
        # model can reshape to [T, V, C] and permute to [C, T, V]. Order per joint:
        # x, y, (validity), (vx, vy).
        if self.graph_layout:
            chans = [xy]  # [T, V, 2]
            if self.emit_validity_flag:
                chans.append(validity[..., None])  # [T, V, 1]
            if self.use_velocity:
                chans.append(vel)  # [T, V, 2]
            g = np.concatenate(chans, axis=2)  # [T, V, C]
            return g.reshape(g.shape[0], -1).astype(np.float32)

        feats = [xy.reshape(xy.shape[0], -1)]  # [T, 34]

        if self.emit_validity_flag:
            feats.append(validity)  # [T, 17]

        if self.use_velocity:
            feats.append(vel.reshape(vel.shape[0], -1))  # [T, 34]

        if self.use_bone_angles:
            feats.append(self._bone_angles(xy))  # [T, len(triplets)]

        return np.concatenate(feats, axis=1).astype(np.float32)

    def _rotate_align(self, xy: np.ndarray) -> np.ndarray:
        shoulder_vec = xy[:, _RSHO] - xy[:, _LSHO]  # [T, 2]
        theta = -np.arctan2(shoulder_vec[:, 1], shoulder_vec[:, 0])
        cos, sin = np.cos(theta), np.sin(theta)
        rot = np.stack([np.stack([cos, -sin], -1), np.stack([sin, cos], -1)], 1)
        return np.einsum("tij,tkj->tki", rot, xy)

    @staticmethod
    def _bone_angles(xy: np.ndarray) -> np.ndarray:
        cols = []
        for a, b, c in _ANGLE_TRIPLETS:
            ia, ib, ic = (KEYPOINT_INDEX[x] for x in (a, b, c))
            v1 = xy[:, ia] - xy[:, ib]
            v2 = xy[:, ic] - xy[:, ib]
            num = (v1 * v2).sum(axis=1)
            den = np.linalg.norm(v1, axis=1) * np.linalg.norm(v2, axis=1) + 1e-8
            cols.append(np.arccos(np.clip(num / den, -1.0, 1.0)))
        return np.stack(cols, axis=1).astype(np.float32)
