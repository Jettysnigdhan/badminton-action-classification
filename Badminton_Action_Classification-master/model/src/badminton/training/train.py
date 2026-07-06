"""Training entrypoint: seeded, class-weighted, early-stopped, MLflow-tracked.

Usage:
    python -m badminton.training.train --config configs/default.yaml
"""

from __future__ import annotations

import argparse
import logging
import random

import numpy as np
import torch
from torch.utils.data import DataLoader

from ..config import Config
from ..data.dataset import SkeletonSequenceDataset, load_manifest, split_records
from ..models import build_model
from .metrics import TemperatureScaler, compute_metrics, expected_calibration_error

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("train")


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def resolve_device(choice: str) -> torch.device:
    if choice == "auto":
        if torch.cuda.is_available():
            return torch.device("cuda")
        if torch.backends.mps.is_available():  # Apple-silicon GPU
            return torch.device("mps")
        return torch.device("cpu")
    return torch.device(choice)


def make_loaders(
    cfg: Config, splits: dict[str, list] | None = None
) -> tuple[DataLoader, DataLoader, DataLoader, SkeletonSequenceDataset]:
    if splits is None:
        records = load_manifest(cfg.data.manifest_path)
        splits = split_records(
            records,
            split_by=cfg.data.split_by,
            val_fraction=cfg.data.val_fraction,
            test_fraction=cfg.data.test_fraction,
            seed=cfg.seed,
        )
    train_ds = SkeletonSequenceDataset(splits["train"], cfg, train=True)
    val_ds = SkeletonSequenceDataset(splits["val"], cfg, train=False)
    test_ds = SkeletonSequenceDataset(splits["test"], cfg, train=False)
    log.info("split sizes: train=%d val=%d test=%d", len(train_ds), len(val_ds), len(test_ds))
    bs = cfg.train.batch_size
    nw = cfg.train.num_workers
    return (
        DataLoader(train_ds, batch_size=bs, shuffle=True, num_workers=nw, drop_last=False),
        DataLoader(val_ds, batch_size=bs, num_workers=nw),
        DataLoader(test_ds, batch_size=bs, num_workers=nw),
        train_ds,
    )


def class_weights(train_ds: SkeletonSequenceDataset, device: torch.device) -> torch.Tensor:
    counts = train_ds.class_counts().astype(np.float64)
    counts = np.where(counts == 0, 1.0, counts)
    w = counts.sum() / (len(counts) * counts)
    return torch.tensor(w, dtype=torch.float32, device=device)


@torch.no_grad()
def collect_logits(model, loader, device) -> tuple[torch.Tensor, torch.Tensor]:
    model.eval()
    all_logits, all_y = [], []
    for x, y in loader:
        all_logits.append(model(x.to(device)).cpu())
        all_y.append(y)
    return torch.cat(all_logits), torch.cat(all_y)


def train(
    cfg: Config,
    splits: dict[str, list] | None = None,
    *,
    use_mlflow: bool = True,
    save_checkpoint: bool = True,
) -> dict:
    set_seed(cfg.seed)
    device = resolve_device(cfg.train.device)
    train_loader, val_loader, test_loader, train_ds = make_loaders(cfg, splits)

    model = build_model(cfg.model, input_dim=train_ds.feature_dim, num_classes=cfg.num_classes)

    # Transfer learning: warm-start the backbone from a pretrained checkpoint.
    if cfg.train.init_from:
        from .transfer import freeze_backbone, load_backbone

        load_backbone(model, cfg.train.init_from)
        if cfg.train.freeze_backbone:
            n = freeze_backbone(model)
            log.info("froze %d backbone tensors (linear-probe)", n)
    model.to(device)

    weights = class_weights(train_ds, device) if cfg.train.class_weighting else None
    criterion = torch.nn.CrossEntropyLoss(weight=weights)
    opt_cls = {"adam": torch.optim.Adam, "adamw": torch.optim.AdamW, "sgd": torch.optim.SGD}[
        cfg.train.optimizer
    ]
    trainable = [p for p in model.parameters() if p.requires_grad]
    optimizer = opt_cls(trainable, lr=cfg.train.lr, weight_decay=cfg.train.weight_decay)

    mlflow = None
    run_ctx = _NullCtx()
    if use_mlflow:
        try:
            import mlflow as _mlflow

            _mlflow.set_experiment(cfg.train.mlflow_experiment)
            run_ctx = _mlflow.start_run()
            mlflow = _mlflow
        except Exception:  # MLflow optional in dev
            mlflow = None
            run_ctx = _NullCtx()

    best_f1, best_state, patience = -1.0, None, 0
    with run_ctx:
        if mlflow:
            mlflow.log_params(
                {"model": cfg.model.name, "lr": cfg.train.lr, "seq_len": cfg.data.sequence_length,
                 "feature_dim": train_ds.feature_dim, "hidden": cfg.model.hidden_size}
            )
        for epoch in range(cfg.train.epochs):
            model.train()
            running = 0.0
            for x, y in train_loader:
                x, y = x.to(device), y.to(device)
                optimizer.zero_grad()
                loss = criterion(model(x), y)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
                optimizer.step()
                running += loss.item() * x.size(0)

            val_logits, val_y = collect_logits(model, val_loader, device)
            val_metrics = compute_metrics(
                val_y.numpy(), val_logits.argmax(1).numpy(), cfg.data.labels
            )
            train_loss = running / max(1, len(train_loader.dataset))
            log.info(
                "epoch %d train_loss=%.4f val_acc=%.3f val_macroF1=%.3f",
                epoch, train_loss, val_metrics["accuracy"], val_metrics["macro_f1"],
            )
            if mlflow:
                mlflow.log_metrics(
                    {"train_loss": train_loss, "val_acc": val_metrics["accuracy"],
                     "val_macro_f1": val_metrics["macro_f1"]}, step=epoch
                )

            if val_metrics["macro_f1"] > best_f1:
                best_f1 = val_metrics["macro_f1"]
                best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
                patience = 0
            else:
                patience += 1
                if patience >= cfg.train.early_stopping_patience:
                    log.info("early stopping at epoch %d (best val_macroF1=%.3f)", epoch, best_f1)
                    break

        if best_state is not None:
            model.load_state_dict(best_state)

        # Calibrate on validation, then evaluate on the held-out test split.
        scaler = TemperatureScaler()
        if cfg.eval.calibration:
            vl, vy = collect_logits(model, val_loader, device)
            scaler.fit(vl, vy)

        test_logits, test_y = collect_logits(model, test_loader, device)
        with torch.no_grad():
            cal_logits = scaler(test_logits) if cfg.eval.calibration else test_logits
            probs = torch.softmax(cal_logits, dim=1).numpy()
        metrics = compute_metrics(test_y.numpy(), probs.argmax(1), cfg.data.labels)
        metrics["ece"] = expected_calibration_error(probs, test_y.numpy())
        metrics["temperature"] = scaler.temperature if cfg.eval.calibration else 1.0
        log.info(
            "TEST acc=%.3f macroF1=%.3f ece=%.3f",
            metrics["accuracy"], metrics["macro_f1"], metrics["ece"],
        )

        # Save a self-contained, servable checkpoint (weights + config + temperature).
        if save_checkpoint:
            ckpt_path = "model.pt"
            torch.save(
                {
                    "model_state": model.state_dict(),
                    "config": cfg.model_dump(),
                    "temperature": metrics["temperature"],
                    "feature_dim": train_ds.feature_dim,
                },
                ckpt_path,
            )
            log.info("saved checkpoint -> %s", ckpt_path)

        if mlflow:
            mlflow.log_metrics(
                {"test_acc": metrics["accuracy"], "test_macro_f1": metrics["macro_f1"],
                 "test_ece": metrics["ece"]}
            )
            if save_checkpoint:
                mlflow.log_artifact(ckpt_path)
    return metrics


class _NullCtx:
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    args = ap.parse_args()
    cfg = Config.from_yaml(args.config)
    train(cfg)


if __name__ == "__main__":
    main()
