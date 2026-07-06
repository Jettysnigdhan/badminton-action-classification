import sys
import os
import torch
import numpy as np

# Ensure model/src is in PYTHONPATH to import badminton modules
sys.path.append(os.path.abspath("model/src"))

from badminton.config import Config
from badminton.models import build_model
from badminton.features.keypoints import FeatureExtractor
from badminton.inference.predictor import ActionPredictor

# 1. Load checkpoint (using correct model.pt filename)
checkpoint_path = "model/model.pt"
print(f"Loading checkpoint from: {checkpoint_path}")
checkpoint = torch.load(checkpoint_path, map_location="cpu")

# 2. Reconstruct config and model
config_dict = checkpoint["config"]
cfg = Config(**config_dict)
print(f"Loaded model architecture: {cfg.model.name}")
print(f"Number of classes: {cfg.num_classes} ({', '.join(cfg.data.labels)})")

# Build the model using feature dimensions
feature_extractor = FeatureExtractor(
    center_joint=cfg.features.center_joint,
    scale=cfg.features.scale,
    rotate_align=cfg.features.rotate_align,
    use_velocity=cfg.features.use_velocity,
    use_bone_angles=cfg.features.use_bone_angles,
    emit_validity_flag=cfg.features.emit_validity_flag,
    min_confidence=cfg.data.min_confidence,
    graph_layout=(cfg.model.name == "stgcn"),
)

feature_dim = feature_extractor.feature_dim()
model = build_model(cfg.model, feature_dim, cfg.num_classes)

# Load state dict
model.load_state_dict(checkpoint["model_state"])
model.eval()  # set to evaluation mode

# 3. Example usage with raw model inference
# Input shape to the model: [batch_size, sequence_length, feature_dimension]
# From checkpoint config, sequence_length = 24, feature_dim = 89
sequence_length = cfg.data.sequence_length
print(f"Expected model input shape: [batch_size, {sequence_length}, {feature_dim}]")

# Create a sample input matching the expected shape
sample_input = torch.randn(1, sequence_length, feature_dim, dtype=torch.float32)

# Run prediction
with torch.no_grad():
    logits = model(sample_input)
    # Apply temperature scaling if present in the checkpoint
    temperature = checkpoint.get("temperature", 1.0)
    probabilities = torch.softmax(logits / temperature, dim=1)

print("\n--- Raw PyTorch Model Output ---")
print("Logits:", logits.numpy())
print("Probabilities:", probabilities.numpy())
print("Predicted Class:", cfg.data.labels[probabilities.argmax().item()])

# 4. Example usage with high-level ActionPredictor (handles keypoint processing)
predictor = ActionPredictor.from_checkpoint(checkpoint_path)

# Mock raw keypoints: [num_frames, 17, 3] (x, y, confidence)
# We feed 24 frames of 17 keypoints
sample_keypoints = np.random.rand(24, 17, 3).astype(np.float32)
# Set confidence to 0.9 for all joints so they aren't masked out
sample_keypoints[:, :, 2] = 0.9

result = predictor.predict(sample_keypoints)
print("\n--- High-level ActionPredictor Output ---")
print("Predicted Label:", result.label)
print("Confidence:", result.confidence)
print("Abstain:", result.abstain)
print("Class Probabilities:")
for label, prob in result.probabilities.items():
    print(f"  {label}: {prob:.4f}")
