# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY model/requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

COPY model/src ./src
COPY model/model.pt ./model.pt

ENV MODEL_PATH=/app/model.pt
ENV PYTHONPATH=/app/src
ENV POSE_DEVICE=cpu
ENV POSE_MODE=balanced
ENV MODEL_VERSION=dev

EXPOSE 8000
CMD ["uvicorn", "badminton.serving.app:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
