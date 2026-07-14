# Docker setup for Badminton Action Classification

This repository now includes real Dockerfiles for the ML model server and the Next.js website.

## Build and run locally

From the repository root:

```bash
docker compose up --build
```

Then open:

```bash
http://localhost:3000
```

The model API will be available at:

```bash
http://localhost:8000
```

## Files created

- `model/Dockerfile` — builds the FastAPI model server
- `website/Dockerfile` — builds the Next.js website
- `compose.yaml` — starts both services together

## Notes

- The model artifact is mounted into the model container from `./model/model.pt`
- The website service is configured with `MODEL_SERVER_URL=http://model:8000`
- If you need GPU support, use a CUDA-compatible Python base image and set `POSE_DEVICE=cuda`
