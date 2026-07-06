"""Generate a synthetic manifest + keypoint .npy files so the pipeline runs end-to-end
without AlphaPose or the Kaggle dataset. Each class gets a distinct motion signature.

    python scripts/make_synthetic_data.py --out data --players 12 --clips-per-class 40
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

LABELS = ["backhand_drive", "backhand_net_shot", "forehand_clear", "forehand_drive"]


def synth_clip(label: str, rng: np.random.Generator, frames: int = 24) -> np.ndarray:
    """Fabricate a [frames, 17, 3] skeleton whose wrist trajectory depends on the label."""
    base = rng.uniform(200, 400, size=(17, 2))
    kp = np.tile(base, (frames, 1, 1)).astype(np.float32)
    t = np.linspace(0, 1, frames)
    amp, phase = {
        "forehand_clear": (120, 0.0),
        "forehand_drive": (60, 0.3),
        "backhand_drive": (60, 3.14),
        "backhand_net_shot": (30, 1.57),
    }[label]
    # animate the right wrist (idx 10) with a class-specific arc
    kp[:, 10, 0] += amp * np.sin(2 * np.pi * t + phase)
    kp[:, 10, 1] += amp * np.cos(2 * np.pi * t + phase) * 0.5
    kp[:, 8, 0] += 0.4 * amp * np.sin(2 * np.pi * t + phase)  # elbow follows
    kp += rng.normal(0, 4, kp.shape)
    conf = rng.uniform(0.6, 1.0, size=(frames, 17, 1)).astype(np.float32)
    return np.concatenate([kp, conf], axis=2)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data")
    ap.add_argument("--players", type=int, default=12)
    ap.add_argument("--clips-per-class", type=int, default=40)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    rng = np.random.default_rng(args.seed)
    out = Path(args.out)
    (out / "kp").mkdir(parents=True, exist_ok=True)
    manifest = out / "manifest.jsonl"

    with open(manifest, "w") as f:
        for label in LABELS:
            for i in range(args.clips_per_class):
                player = f"p{rng.integers(0, args.players):02d}"
                vid = f"{label}_{i:03d}"
                kp = synth_clip(label, rng)
                path = out / "kp" / f"{vid}.npy"
                np.save(path, kp)
                f.write(json.dumps({
                    "video_id": vid, "player_id": player,
                    "label": label, "keypoints_path": str(path),
                }) + "\n")
    print(f"wrote {manifest} and {len(LABELS) * args.clips_per_class} clips")


if __name__ == "__main__":
    main()
