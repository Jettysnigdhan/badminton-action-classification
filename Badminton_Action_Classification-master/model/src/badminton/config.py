"""Typed, validated configuration. One YAML -> one reproducible run."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field, field_validator


class DataConfig(BaseModel):
    manifest_path: str
    labels: list[str] = Field(min_length=2)
    sequence_length: int = Field(16, ge=2)
    sampling: Literal["uniform", "frame_difference"] = "uniform"
    min_confidence: float = Field(0.3, ge=0.0, le=1.0)
    split_by: Literal["player", "video"] = "player"
    val_fraction: float = Field(0.15, gt=0.0, lt=1.0)
    test_fraction: float = Field(0.15, gt=0.0, lt=1.0)

    @field_validator("labels")
    @classmethod
    def _unique_labels(cls, v: list[str]) -> list[str]:
        if len(set(v)) != len(v):
            raise ValueError("labels must be unique")
        return v


class FeaturesConfig(BaseModel):
    center_joint: Literal["pelvis"] = "pelvis"
    scale: Literal["torso", "bbox", "none"] = "torso"
    rotate_align: bool = False
    use_velocity: bool = True
    use_bone_angles: bool = True
    emit_validity_flag: bool = True


class AugmentConfig(BaseModel):
    enabled: bool = True
    horizontal_mirror: bool = True
    temporal_jitter: float = Field(0.1, ge=0.0, le=1.0)
    joint_noise_std: float = Field(0.01, ge=0.0)
    joint_dropout_p: float = Field(0.05, ge=0.0, le=1.0)


class ModelConfig(BaseModel):
    name: Literal["bilstm_attn", "tcn", "stgcn"] = "bilstm_attn"
    hidden_size: int = Field(128, ge=8)
    num_layers: int = Field(2, ge=1)
    dropout: float = Field(0.3, ge=0.0, lt=1.0)
    bidirectional: bool = True


class TrainConfig(BaseModel):
    epochs: int = Field(100, ge=1)
    batch_size: int = Field(32, ge=1)
    lr: float = Field(1e-3, gt=0.0)
    weight_decay: float = Field(1e-4, ge=0.0)
    optimizer: Literal["adam", "adamw", "sgd"] = "adam"
    class_weighting: bool = True
    early_stopping_patience: int = Field(12, ge=1)
    num_folds: int = Field(5, ge=1)
    num_workers: int = Field(0, ge=0)  # 0 avoids macOS spawn/shm issues; raise on Linux
    # Transfer learning: load a pretrained backbone (classifier head is reinitialized
    # since class spaces differ). freeze_backbone trains only the head (linear probe).
    init_from: str | None = None
    freeze_backbone: bool = False
    device: Literal["auto", "cpu", "cuda", "mps"] = "auto"
    mlflow_experiment: str = "badminton-action"


class EvalConfig(BaseModel):
    calibration: bool = True
    report_per_class: bool = True


class Config(BaseModel):
    seed: int = 42
    data: DataConfig
    features: FeaturesConfig = FeaturesConfig()
    augment: AugmentConfig = AugmentConfig()
    model: ModelConfig = ModelConfig()
    train: TrainConfig = TrainConfig()
    eval: EvalConfig = EvalConfig()

    @property
    def num_classes(self) -> int:
        return len(self.data.labels)

    @classmethod
    def from_yaml(cls, path: str | Path) -> Config:
        with open(path) as f:
            return cls(**yaml.safe_load(f))
