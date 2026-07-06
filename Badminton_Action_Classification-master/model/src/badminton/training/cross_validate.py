"""Leakage-safe k-fold cross-validation.

The paper reported a single accuracy point on 40 clips (±~12% at 95% CI). This runner
reports mean ± std across k folds, with folds that are **group-disjoint** (no clip's
group spans folds) and **stratified** by class where possible.

For each fold: the held-out group is the test set; from the remaining groups a small
validation slice is carved (for early stopping + temperature calibration), and the rest
is training. Metrics are aggregated across folds.

Usage:
    python -m badminton.training.cross_validate --config configs/default.yaml --folds 5
"""

from __future__ import annotations

import argparse
import logging

import numpy as np

from ..config import Config
from ..data.dataset import ClipRecord, load_manifest
from .train import train

log = logging.getLogger("cv")


def _group_key(cfg: Config):
    return (lambda r: r.player_id) if cfg.data.split_by == "player" else (lambda r: r.video_id)


def make_folds(
    records: list[ClipRecord], n_folds: int, key, labels: list[str], seed: int
) -> list[np.ndarray]:
    """Return a list of test-index arrays, one per fold, group-disjoint + stratified."""
    y = np.array([labels.index(r.label) for r in records])
    groups = np.array([key(r) for r in records])
    try:
        from sklearn.model_selection import StratifiedGroupKFold

        skf = StratifiedGroupKFold(n_splits=n_folds, shuffle=True, random_state=seed)
        return [test_idx for _, test_idx in skf.split(records, y, groups)]
    except Exception:  # fallback: plain grouped folds
        from sklearn.model_selection import GroupKFold

        gkf = GroupKFold(n_splits=n_folds)
        return [test_idx for _, test_idx in gkf.split(records, y, groups)]


def carve_val(train_idx: np.ndarray, groups: np.ndarray, frac: float, seed: int) -> tuple:
    """Hold out whole groups from train_idx for validation."""
    rng = np.random.default_rng(seed)
    uniq = np.unique(groups[train_idx])
    rng.shuffle(uniq)
    n_val = max(1, round(len(uniq) * frac))
    val_groups = set(uniq[:n_val].tolist())
    is_val = np.array([groups[i] in val_groups for i in train_idx])
    return train_idx[~is_val], train_idx[is_val]


def cross_validate(cfg: Config, n_folds: int) -> dict:
    records = load_manifest(cfg.data.manifest_path)
    key = _group_key(cfg)
    groups = np.array([key(r) for r in records])
    folds = make_folds(records, n_folds, key, cfg.data.labels, cfg.seed)

    accs, f1s, eces = [], [], []
    for k, test_idx in enumerate(folds):
        train_pool = np.setdiff1d(np.arange(len(records)), test_idx)
        tr_idx, val_idx = carve_val(train_pool, groups, cfg.data.val_fraction, cfg.seed + k)
        splits = {
            "train": [records[i] for i in tr_idx],
            "val": [records[i] for i in val_idx],
            "test": [records[i] for i in test_idx],
        }
        log.info(
            "fold %d/%d: train=%d val=%d test=%d",
            k + 1, n_folds, len(tr_idx), len(val_idx), len(test_idx),
        )
        m = train(cfg, splits, use_mlflow=False, save_checkpoint=False)
        accs.append(m["accuracy"])
        f1s.append(m["macro_f1"])
        eces.append(m["ece"])
        log.info(
            "  fold %d: acc=%.3f macroF1=%.3f ece=%.3f",
            k + 1, m["accuracy"], m["macro_f1"], m["ece"],
        )

    summary = {
        "folds": n_folds,
        "accuracy_mean": float(np.mean(accs)), "accuracy_std": float(np.std(accs)),
        "macro_f1_mean": float(np.mean(f1s)), "macro_f1_std": float(np.std(f1s)),
        "ece_mean": float(np.mean(eces)), "ece_std": float(np.std(eces)),
        "per_fold": {"accuracy": accs, "macro_f1": f1s, "ece": eces},
    }
    log.info(
        "CV RESULT (%d folds): acc=%.3f±%.3f macroF1=%.3f±%.3f ece=%.3f±%.3f",
        n_folds, summary["accuracy_mean"], summary["accuracy_std"],
        summary["macro_f1_mean"], summary["macro_f1_std"],
        summary["ece_mean"], summary["ece_std"],
    )
    return summary


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--folds", type=int, default=None, help="override cfg.train.num_folds")
    args = ap.parse_args()
    cfg = Config.from_yaml(args.config)
    cross_validate(cfg, args.folds or cfg.train.num_folds)


if __name__ == "__main__":
    main()
