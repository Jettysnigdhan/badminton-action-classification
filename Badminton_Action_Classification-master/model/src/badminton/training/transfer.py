"""Transfer learning: load a pretrained backbone, reinitialize the classifier head.

Pretraining on a larger skeleton corpus (e.g. ShuttleSet/BadmintonDB skeletons, or a
generic set like NTU RGB+D) and fine-tuning on our 662 clips is the most direct lever
against data scarcity — the constraint the experiments identified.

The class spaces differ between datasets, so the final classifier (named ``head`` in
both BiLSTM and ST-GCN) cannot transfer. We copy every backbone tensor whose name and
shape match, and leave the head (and any shape-mismatched tensor) freshly initialized.
This is architecture-agnostic: it works for any model as long as its classifier is
under the ``head`` prefix.
"""

from __future__ import annotations

import logging

import torch
from torch import nn

log = logging.getLogger("transfer")

HEAD_PREFIXES = ("head",)


def _source_state(checkpoint_path: str) -> dict:
    """Accept either our checkpoint dict {model_state: ...} or a raw state_dict."""
    ckpt = torch.load(checkpoint_path, map_location="cpu")
    if isinstance(ckpt, dict) and "model_state" in ckpt:
        return ckpt["model_state"]
    return ckpt


def load_backbone(
    model: nn.Module,
    checkpoint_path: str,
    exclude_prefixes: tuple[str, ...] = HEAD_PREFIXES,
) -> dict:
    """Copy matching backbone weights from a pretrained checkpoint into ``model``.

    Returns a summary dict with counts. Tensors are copied only when the name exists in
    the source AND shapes match AND the name is not under an excluded (head) prefix.
    """
    src = _source_state(checkpoint_path)
    tgt = model.state_dict()
    new_state, loaded, skipped_head, skipped_mismatch = {}, [], [], []
    for k, v in tgt.items():
        if any(k.startswith(p) for p in exclude_prefixes):
            new_state[k] = v
            skipped_head.append(k)
        elif k in src and src[k].shape == v.shape:
            new_state[k] = src[k]
            loaded.append(k)
        else:
            new_state[k] = v
            skipped_mismatch.append(k)
    model.load_state_dict(new_state)
    summary = {
        "loaded": len(loaded),
        "skipped_head": len(skipped_head),
        "skipped_mismatch": len(skipped_mismatch),
        "total": len(tgt),
    }
    log.info(
        "transfer from %s: loaded %d/%d (head reinit=%d, mismatch=%d)",
        checkpoint_path, summary["loaded"], summary["total"],
        summary["skipped_head"], summary["skipped_mismatch"],
    )
    return summary


def freeze_backbone(model: nn.Module, exclude_prefixes: tuple[str, ...] = HEAD_PREFIXES) -> int:
    """Freeze all params except the head (linear-probe fine-tuning). Returns #frozen."""
    frozen = 0
    for name, p in model.named_parameters():
        if not any(name.startswith(pfx) for pfx in exclude_prefixes):
            p.requires_grad_(False)
            frozen += 1
    return frozen
