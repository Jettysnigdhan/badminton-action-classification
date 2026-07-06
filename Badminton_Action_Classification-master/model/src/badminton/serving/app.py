"""FastAPI app exposing health + keypoint prediction.

Video upload -> pose -> predict is intentionally an async/queued path in production
(see README architecture); this app exposes the synchronous keypoint endpoint plus a
hook for the worker to reuse the same predictor.
"""

from __future__ import annotations

import logging
import os
import tempfile
import io
import base64

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ..inference.pose import RTMPoseEstimator
from ..inference.predictor import ActionPredictor
from ..inference.video import read_video_uniform
from .schemas import HealthResponse, KeypointPredictRequest, PredictResponse

log = logging.getLogger("serving")
app = FastAPI(title="Badminton Action Classification", version="0.1.0")

# Allow the Next.js app (and curl) to call the model server during local dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.getenv("MODEL_PATH", "")
MODEL_VERSION = os.getenv("MODEL_VERSION", "dev")
POSE_FRAMES = int(os.getenv("POSE_FRAMES", "24"))
POSE_MODE = os.getenv("POSE_MODE", "balanced")  # lightweight | balanced | performance
POSE_DEVICE = os.getenv("POSE_DEVICE", "cpu")  # cpu | cuda | mps
_predictor: ActionPredictor | None = None
_pose: RTMPoseEstimator | None = None


def get_predictor() -> ActionPredictor | None:
    global _predictor
    if _predictor is None and MODEL_PATH and os.path.exists(MODEL_PATH):
        log.info("loading model from %s", MODEL_PATH)
        _predictor = ActionPredictor.from_checkpoint(MODEL_PATH)
    return _predictor


def get_pose() -> RTMPoseEstimator:
    """Lazily construct the RTMPose estimator (models download on first use)."""
    global _pose
    if _pose is None:
        _pose = RTMPoseEstimator(mode=POSE_MODE, device=POSE_DEVICE)
    return _pose


@app.on_event("startup")
def _startup() -> None:
    get_predictor()


@app.get("/", include_in_schema=False)
def root() -> dict[str, str | list[str]]:
    return {
        "status": "ok",
        "message": "Badminton Action Classification API",
        "endpoints": ["/health", "/v1/predict/keypoints", "/v1/predict/video"],
    }


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=get_predictor() is not None,
        model_version=MODEL_VERSION,
    )


@app.post("/v1/predict/keypoints", response_model=PredictResponse)
def predict_keypoints(req: KeypointPredictRequest) -> PredictResponse:
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(status_code=503, detail="model not loaded")
    arr = np.asarray(req.keypoints, dtype=np.float32)
    if arr.ndim != 3 or arr.shape[1] != 17 or arr.shape[2] != 3:
        raise HTTPException(status_code=422, detail="keypoints must be [num_frames, 17, 3]")
    result = predictor.predict(arr)
    return PredictResponse(
        label=result.label,
        confidence=result.confidence,
        abstain=result.abstain,
        probabilities=result.probabilities,
        model_version=MODEL_VERSION,
    )


@app.post("/v1/predict/video", response_model=PredictResponse)
async def predict_video(clip: UploadFile = File(...)) -> PredictResponse:
    """Full pipeline: uploaded video -> RTMPose keypoints -> calibrated prediction."""
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(status_code=503, detail="model not loaded")

    suffix = os.path.splitext(clip.filename or "")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await clip.read())
        path = tmp.name

    try:
        frames = read_video_uniform(path, POSE_FRAMES)
        keypoints = get_pose().estimate(frames)
        result = predictor.predict(keypoints)
    except (OSError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"could not process video: {e}") from e
    finally:
        try:
            os.remove(path)
        except OSError:
            pass

    # --- Create a small thumbnail around the detected player -----------------
    thumbnail_data: str | None = None
    try:
        # keypoints: [T, 17, 3] -> coordinates may be absolute pixels or normalized [0,1]
        kp = keypoints
        if kp is not None and kp.size:
            xs = kp[..., 0]
            ys = kp[..., 1]
            confs = kp[..., 2]
            # only consider valid points
            valid_mask = confs > 0
            if valid_mask.any():
                xs_valid = xs[valid_mask]
                ys_valid = ys[valid_mask]
                h, w = frames.shape[1], frames.shape[2]
                # detect if coordinates are normalized (<=1)
                if xs_valid.max() <= 1.01 and ys_valid.max() <= 1.01:
                    xs_valid = xs_valid * w
                    ys_valid = ys_valid * h

                x0 = int(max(xs_valid.min() - 10, 0))
                y0 = int(max(ys_valid.min() - 10, 0))
                x1 = int(min(xs_valid.max() + 10, w - 1))
                y1 = int(min(ys_valid.max() + 10, h - 1))

                # choose middle frame for the thumbnail
                mid = int(len(frames) // 2)
                frame = frames[mid]
                img = Image.fromarray(frame)
                if x1 > x0 and y1 > y0:
                    crop = img.crop((x0, y0, x1, y1)).resize((100, 100))
                else:
                    crop = img.resize((100, 100))

                buf = io.BytesIO()
                crop.save(buf, format="PNG")
                thumbnail_data = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception as _:
        thumbnail_data = None

    return PredictResponse(
        label=result.label,
        confidence=result.confidence,
        abstain=result.abstain,
        probabilities=result.probabilities,
        model_version=MODEL_VERSION,
        thumbnail=thumbnail_data,
    )
