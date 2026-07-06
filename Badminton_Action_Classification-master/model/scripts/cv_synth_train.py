"""Leakage-safe CV that USES synthetic data the correct way.

Real clips alone are too few (661), so we augment the *training* set with the
synthetic clips — but evaluation stays honest: each fold's val/test sets are
REAL clips only (group-disjoint), and synthetic clips are added to TRAIN only.
This avoids the near-duplicate leakage that inflates a naive real+synth k-fold.

Usage:
    PYTHONPATH=src python scripts/cv_synth_train.py --config configs/improved_real.yaml \
        --real data/manifest_real.jsonl --synth data/manifest_synth.jsonl --folds 5
"""

from __future__ import annotations

import argparse
import logging

import numpy as np

from badminton.config import Config
from badminton.data.dataset import load_manifest
from badminton.training.cross_validate import _group_key, carve_val, make_folds
from badminton.training.train import train

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("cv-synth")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--real", required=True)
    ap.add_argument("--synth", required=True)
    ap.add_argument("--folds", type=int, default=5)
    args = ap.parse_args()

    cfg = Config.from_yaml(args.config) if hasattr(Config, "from_yaml") else _load_cfg(args.config)
    real = load_manifest(args.real)
    synth = load_manifest(args.synth)
    log.info("real=%d  synth=%d (train-only)", len(real), len(synth))

    key = _group_key(cfg)
    groups = np.array([key(r) for r in real])
    folds = make_folds(real, args.folds, key, cfg.data.labels, cfg.seed)

    accs, f1s, eces = [], [], []
    for k, test_idx in enumerate(folds):
        pool = np.setdiff1d(np.arange(len(real)), test_idx)
        tr_idx, val_idx = carve_val(pool, groups, cfg.data.val_fraction, cfg.seed + k)
        splits = {
            "train": [real[i] for i in tr_idx] + synth,  # synthetic in TRAIN only
            "val": [real[i] for i in val_idx],            # real only
            "test": [real[i] for i in test_idx],          # real only
        }
        log.info(
            "fold %d/%d: train=%d (+%d synth) val=%d test=%d",
            k + 1, args.folds, len(tr_idx), len(synth), len(val_idx), len(test_idx),
        )
        m = train(cfg, splits, use_mlflow=False, save_checkpoint=False)
        accs.append(m["accuracy"]); f1s.append(m["macro_f1"]); eces.append(m["ece"])
        log.info("  fold %d: acc=%.3f macroF1=%.3f ece=%.3f", k + 1, m["accuracy"], m["macro_f1"], m["ece"])

    log.info(
        "CV RESULT (%d folds, real test / synth-augmented train): "
        "acc=%.3f±%.3f  macroF1=%.3f±%.3f  ece=%.3f±%.3f",
        args.folds, np.mean(accs), np.std(accs), np.mean(f1s), np.std(f1s), np.mean(eces), np.std(eces),
    )
    log.info("per-fold acc: %s", [round(a, 3) for a in accs])


def _load_cfg(path: str) -> Config:
    import yaml

    with open(path) as f:
        return Config(**yaml.safe_load(f))


if __name__ == "__main__":
    main()
