import json
import numpy as np
import requests
import torch

from model.src.badminton.inference.predictor import ActionPredictor
from model.src.badminton.data import sampling

SERVER_URL = "http://127.0.0.1:8000/v1/predict/keypoints"
CKPT_PATH = "model/model.pt"


def make_deterministic_keypoints(T=24):
    base = np.array([
        [0.50, 0.20, 0.90], [0.42, 0.34, 0.88], [0.58, 0.34, 0.88],
        [0.36, 0.48, 0.84], [0.64, 0.48, 0.84], [0.30, 0.60, 0.80],
        [0.70, 0.60, 0.80], [0.24, 0.76, 0.76], [0.76, 0.76, 0.76],
        [0.28, 0.90, 0.72], [0.72, 0.90, 0.72], [0.40, 0.14, 0.88],
        [0.60, 0.14, 0.88], [0.34, 0.24, 0.86], [0.66, 0.24, 0.86],
        [0.30, 0.30, 0.82], [0.70, 0.30, 0.82]
    ], dtype=np.float32)
    phase = np.linspace(0.0, 0.15, T, dtype=np.float32)[:, None]
    out = np.tile(base[None, :, :], (T, 1, 1))
    out[..., 0] += phase
    out[..., 1] += phase * 0.5
    out[..., 2] = np.clip(out[..., 2], 0.5, 1.0)
    return out


def local_logits_and_probs(kp):
    predictor = ActionPredictor.from_checkpoint(CKPT_PATH, device='cpu')
    cfg = predictor.cfg
    # replicate sampling
    idx = sampling.sample(kp, cfg.data.sequence_length, cfg.data.sampling)
    feats = predictor.extractor(kp[idx])
    x = torch.from_numpy(feats).unsqueeze(0)
    with torch.no_grad():
        logits = predictor.model(x) / predictor.temperature
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
    return logits.squeeze(0).cpu().numpy(), probs


def server_prediction(kp):
    payload = {"keypoints": kp.tolist()}
    r = requests.post(SERVER_URL, json=payload, timeout=10)
    r.raise_for_status()
    return r.json()


def main():
    kp = make_deterministic_keypoints(T=24)
    print("Computing local logits/probs...")
    logits, probs = local_logits_and_probs(kp)
    print("Local logits:", logits)
    print("Local probs:", probs)

    print("Calling server...")
    srv = server_prediction(kp)
    print(json.dumps(srv, indent=2))

    # Compare top class and confidence
    local_top = int(probs.argmax())
    srv_top_label = srv["label"]
    print("Local top index:", local_top)
    print("Local top prob:", float(probs[local_top]))
    print("Server top label:", srv_top_label)

if __name__ == '__main__':
    main()
