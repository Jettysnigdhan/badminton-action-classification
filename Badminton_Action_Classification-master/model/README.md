# Badminton Action Classification (Skeleton-based)

Production-grade reimplementation and extension of *"Badminton Action Classification
Based on Human Skeleton Data Extracted by AlphaPose"*.

Pipeline: **video → pose estimation (pluggable) → keypoint normalization & kinematic
features → temporal model (BiLSTM/TCN/ST-GCN) → calibrated shot class**.

The original paper used raw pixel `(x, y, conf)` keypoints and a 5-layer LSTM on 400
clips (80% accuracy). This repo fixes the two issues that block generalization —
**no keypoint normalization** and an **over-parameterized model** — and adds the
engineering needed to ship it: typed config, data versioning hooks, k-fold + calibrated
metrics, an inference API, tests, Docker, and CI.

## Why the changes matter
- **Normalization** (root-center + scale by torso length): the model learns *motion*,
  not *where the player stands in frame*. Without it the model does not transfer to a
  new camera/court.
- **Subject-disjoint splits**: sequences from the same video must not span train/test,
  or accuracy is inflated.
- **Right-sized model**: a 2-layer BiLSTM+attention beats a 5×128 stack on this data size.

## Quickstart
```bash
make dev                 # install package + dev tooling
make test                # run the test suite

# Option A — real videos under data/archive/<class>/*.mp4:
pip install ".[pose]"    # rtmlib + onnxruntime + opencv (RTMPose backend)
make extract             # videos -> keypoints (.npy) + data/manifest.jsonl
make cv                  # k-fold cross-validation (honest mean ± std)
make train               # final model -> model.pt

# Option B — no videos/AlphaPose handy (synthetic smoke test):
make data && make train

make serve               # FastAPI inference service on :8000

# Try the graph model (ST-GCN) instead of the BiLSTM — same data, exploits skeleton structure:
python -m badminton.training.cross_validate --config configs/stgcn.yaml
python -m badminton.training.train --config configs/stgcn.yaml
```

### Models
- `bilstm_attn` (default) — BiLSTM + temporal attention over flattened joints.
- `stgcn` — Spatial-Temporal GCN over the COCO-17 skeleton graph (`configs/stgcn.yaml`).
  Selected via `model.name`; the feature extractor switches to joint-grouped graph layout
  automatically, so the rest of the pipeline (dataset, training, serving) is unchanged.

### Transfer learning (recommended — data is the accuracy bottleneck)
Pretrain a backbone on a larger external skeleton corpus, then fine-tune on our 662 clips.
The classifier head is reinitialized (class spaces differ); all matching backbone weights
transfer. Architecture-agnostic (works for BiLSTM and ST-GCN).

```bash
# 1. Convert external skeletons to our COCO-17 manifest (remaps any joint layout by name)
python scripts/convert_external.py --root extern/shuttleset --out data_pretrain --layout coco17
# 2. Pretrain on them (point manifest_path -> data_pretrain, labels = external classes)
python -m badminton.training.train --config configs/pretrain_external.yaml   # produces model.pt
mv model.pt pretrained.pt
# 3. Fine-tune on our 5 classes from the pretrained backbone
python -m badminton.training.train --config configs/finetune.yaml           # train.init_from: pretrained.pt
```
`train.freeze_backbone: true` does a linear probe (train head only). Joint layouts are in
`badminton.data.adapters.LAYOUTS` (coco17, halpe26, openpose25 — extend as needed).

### Real dataset
`data/archive/<class>/*.mp4` (5 classes, 662 clips). `make extract` runs RTMPose
(via `rtmlib`, ONNX — no mmcv build) per clip, selects the most-confident person per
frame, and writes `[num_frames, 17, 3]` keypoints + a manifest. Player IDs are unknown,
so splits are **video-disjoint** (`split_by: video`).

## Layout
```
src/badminton/
  config.py            # typed Pydantic config
  features/keypoints.py# normalization + kinematic features (the key fix)
  data/sampling.py     # frame-difference boundary + uniform temporal sampling
  data/dataset.py      # torch Dataset, video-disjoint splitting, windowing
  models/              # BiLSTM (+ factory for TCN/ST-GCN later)
  training/            # train loop, metrics, MLflow tracking, early stopping
  inference/           # PoseEstimator interface + Predictor
  serving/             # FastAPI app + schemas
```

## Data contract
Each sample is a sequence of `T` frames of `17` COCO keypoints with `(x, y, confidence)`.
Labels: `backhand_drive`, `backhand_net_shot`, `forehand_clear`, `forehand_drive`
(extensible via config).

See `configs/default.yaml` for all knobs. All randomness is seeded; splits are
deterministic and **video-disjoint**.
