"""Convert an external skeleton dataset into our manifest + COCO-17 .npy format.

Assumes the external data is laid out as ``<root>/<class>/<clip>.npy`` where each .npy
is ``[T, J, 3]`` (x, y, confidence) in a known joint layout (see data.adapters.LAYOUTS).
Produces ``<out>/kp/*.npy`` (remapped to COCO-17) + ``<out>/manifest.jsonl`` ready for
pretraining via the standard training entrypoint.

Example (ShuttleSet skeletons exported as per-class .npy in MMPose COCO-17):
    python scripts/convert_external.py --root extern/shuttleset --out data_pretrain \
        --layout coco17
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from badminton.data.adapters import remap_by_layout


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True, help="<root>/<class>/<clip>.npy")
    ap.add_argument("--out", default="data_pretrain")
    ap.add_argument(
        "--layout", default="coco17", help="source joint layout (data.adapters.LAYOUTS)"
    )
    args = ap.parse_args()

    root, out = Path(args.root), Path(args.out)
    (out / "kp").mkdir(parents=True, exist_ok=True)
    manifest = out / "manifest.jsonl"

    written, failed = 0, 0
    with open(manifest, "w") as mf:
        for class_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            for src in sorted(class_dir.glob("*.npy")):
                vid = f"{class_dir.name}__{src.stem}".replace(" ", "_")
                try:
                    kp = remap_by_layout(np.load(src), args.layout)  # -> [T, 17, 3]
                    np.save(out / "kp" / f"{vid}.npy", kp)
                    mf.write(json.dumps({
                        "video_id": vid,
                        "player_id": vid,  # group == clip unless external IDs exist
                        "label": class_dir.name,
                        "keypoints_path": str(out / "kp" / f"{vid}.npy"),
                    }) + "\n")
                    written += 1
                except Exception as e:  # noqa: BLE001
                    failed += 1
                    print(f"  [skip] {src}: {type(e).__name__}: {e}")
    print(f"wrote {manifest}: {written} clips ({failed} failed)")


if __name__ == "__main__":
    main()
