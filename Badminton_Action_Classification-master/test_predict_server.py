import json
import numpy as np
import requests

URL = "http://127.0.0.1:8000/v1/predict/keypoints"

def make_deterministic_keypoints(T=24):
    # deterministic synthetic keypoints similar to the fallback used in RTMPoseEstimator
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
    return out.tolist()

def main():
    kp = make_deterministic_keypoints(T=24)
    payload = {"keypoints": kp}
    print(f"Posting {len(kp)} frames to {URL}")
    r = requests.post(URL, json=payload, timeout=10)
    try:
        print("Status:", r.status_code)
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print("Response text:", r.text)

if __name__ == '__main__':
    main()
