"""Extract skeleton keypoints from the raw video dataset.

Walks ``<root>/<label>/*.mp4``, runs the pose estimator per clip, and writes:
  - one ``[num_frames, 17, 3]`` .npy per clip under ``<out>/kp/``
  - a JSONL manifest consumable by badminton.data.dataset

Usage:
    python scripts/extract_keypoints.py --root data/archive --out data \
        --mode balanced --max-frames 32 --stride 2
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

from badminton.inference.pose import RTMPoseEstimator
from badminton.inference.video import read_video, read_video_uniform

VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv"}


def discover(root: Path) -> list[tuple[str, Path]]:
    """Return (label, video_path) for every class subfolder."""
    items: list[tuple[str, Path]] = []
    for class_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        for vid in sorted(class_dir.iterdir()):
            if vid.suffix.lower() in VIDEO_EXTS:
                items.append((class_dir.name, vid))
    return items


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="data/archive")
    ap.add_argument("--out", default="data")
    ap.add_argument(
        "--mode", default="balanced", choices=["lightweight", "balanced", "performance"]
    )
    ap.add_argument("--device", default="cpu")
    ap.add_argument(
        "--frames", type=int, default=24,
        help="frames sampled evenly across the WHOLE clip (recommended; covers the swing)",
    )
    ap.add_argument(
        "--max-frames", type=int, default=0,
        help="legacy: read first N strided frames instead of whole-clip sampling (0 = off)",
    )
    ap.add_argument("--stride", type=int, default=2, help="legacy stride for --max-frames mode")
    ap.add_argument("--limit", type=int, default=0, help="cap total clips (0 = all)")
    ap.add_argument("--per-class", type=int, default=0, help="cap clips per class (0 = all)")
    args = ap.parse_args()

    root, out = Path(args.root), Path(args.out)
    (out / "kp").mkdir(parents=True, exist_ok=True)
    manifest_path = out / "manifest.jsonl"

    items = discover(root)
    if args.per_class:
        per: dict[str, int] = {}
        kept = []
        for label, vid in items:
            if per.get(label, 0) < args.per_class:
                kept.append((label, vid))
                per[label] = per.get(label, 0) + 1
        items = kept
    if args.limit:
        items = items[: args.limit]
    if not items:
        sys.exit(f"no videos found under {root}")
    print(f"found {len(items)} clips across {len({lbl for lbl, _ in items})} classes")

    estimator = RTMPoseEstimator(mode=args.mode, device=args.device)
    written, failed = 0, 0
    with open(manifest_path, "w") as mf:
        for i, (label, vid) in enumerate(items, 1):
            video_id = f"{label}__{vid.stem}".replace(" ", "_")
            kp_path = out / "kp" / f"{video_id}.npy"
            try:
                if args.max_frames:  # legacy first-N-frames mode
                    frames = read_video(str(vid), max_frames=args.max_frames, stride=args.stride)
                else:  # whole-clip uniform sampling (default, recommended)
                    frames = read_video_uniform(str(vid), num_frames=args.frames)
                kp = estimator.estimate(frames)  # [T, 17, 3]
                np.save(kp_path, kp)
                mf.write(json.dumps({
                    "video_id": video_id,
                    "player_id": video_id,  # no player labels -> group == video
                    "label": label,
                    "keypoints_path": str(kp_path),
                }) + "\n")
                written += 1
            except Exception as e:  # keep going; a few corrupt clips shouldn't stop a run
                failed += 1
                print(f"  [skip] {vid}: {type(e).__name__}: {e}", file=sys.stderr)
            if i % 25 == 0 or i == len(items):
                print(f"  {i}/{len(items)} processed (ok={written}, failed={failed})")

    print(f"wrote {manifest_path} ({written} clips, {failed} failed)")


if __name__ == "__main__":
    main()
