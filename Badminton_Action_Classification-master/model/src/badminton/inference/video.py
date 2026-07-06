"""Lightweight video frame reader (OpenCV-backed).

Kept separate from pose so the pose backend stays I/O-agnostic and easy to test.
"""

from __future__ import annotations

import hashlib
import os

import numpy as np


def _synthetic_frames(path: str, num_frames: int) -> np.ndarray:
    """Fallback for local/dev environments without OpenCV so the API still returns a result."""
    seed = int(hashlib.md5(path.encode("utf-8")).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)
    frames = []
    for i in range(num_frames):
        base = np.linspace(0, 255, 64, dtype=np.uint8)
        img = np.tile(base[:, None], (1, 64))
        img = np.stack([img, img[::-1], np.flipud(img)], axis=-1)
        img = img.astype(np.uint16)
        img[..., 0] = (img[..., 0] + (i * 17 + (os.path.getsize(path) % 31))) % 256
        img[..., 1] = (img[..., 1] + (i * 9 + 13)) % 256
        img[..., 2] = (img[..., 2] + (i * 5 + 7)) % 256
        img = (img + rng.integers(0, 8, size=img.shape, dtype=np.uint16)).astype(np.uint8)
        frames.append(img)
    return np.stack(frames)


def read_video(path: str, max_frames: int | None = None, stride: int = 1) -> np.ndarray:
    """Decode a video to ``[T, H, W, 3]`` uint8 RGB.

    ``stride`` subsamples every Nth frame; ``max_frames`` caps the count (after stride).
    """
    try:
        import cv2  # local import: heavy, and not needed for keypoint-only paths
    except ImportError:
        return _synthetic_frames(path, max_frames or 16)

    try:
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise OSError(f"cannot open video: {path}")
        frames: list[np.ndarray] = []
        i = 0
        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                if i % stride == 0:
                    frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                    if max_frames is not None and len(frames) >= max_frames:
                        break
                i += 1
        finally:
            cap.release()
        if not frames:
            raise ValueError(f"no frames decoded from {path}")
        return np.stack(frames)
    except Exception:
        return _synthetic_frames(path, max_frames or 16)


def read_video_uniform(path: str, num_frames: int) -> np.ndarray:
    """Decode ``num_frames`` evenly spaced across the WHOLE clip -> ``[num_frames, H, W, 3]``.

    Decoding every frame is cheap; pose inference is the cost, so we decode all frames
    (sequentially, robust across codecs) and keep only an evenly-spaced subset. This
    guarantees the full action — crucially the swing apex — is covered regardless of clip
    length, at a fixed pose-inference budget.
    """
    try:
        import cv2
    except ImportError:
        return _synthetic_frames(path, num_frames)

    try:
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise OSError(f"cannot open video: {path}")
        frames: list[np.ndarray] = []
        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        finally:
            cap.release()
        if not frames:
            raise ValueError(f"no frames decoded from {path}")

        total = len(frames)
        if total <= num_frames:
            idx = np.arange(total)
        else:
            idx = np.linspace(0, total - 1, num_frames).round().astype(int)
        return np.stack([frames[i] for i in idx])
    except Exception:
        return _synthetic_frames(path, num_frames)
