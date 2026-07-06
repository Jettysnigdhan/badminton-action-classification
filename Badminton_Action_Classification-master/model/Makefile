.PHONY: install dev test lint type data extract train cv serve docker all

# Auto-detect the interpreter: prefer python3, fall back to python.
# Override on the CLI with `make train PYTHON=/path/to/python`.
PYTHON ?= $(shell command -v python3 || command -v python)
PIP    ?= $(PYTHON) -m pip

install:
	$(PIP) install -e .

dev:
	$(PIP) install -e ".[dev]"

lint:
	$(PYTHON) -m ruff check src tests

type:
	$(PYTHON) -m mypy src

test:
	$(PYTHON) -m pytest --cov=badminton --cov-report=term-missing

data:
	$(PYTHON) scripts/make_synthetic_data.py --out data

# Extract real keypoints from videos under data/archive (needs rtmlib + onnxruntime).
extract:
	$(PYTHON) scripts/extract_keypoints.py --root data/archive --out data --mode balanced --frames 24

train:
	$(PYTHON) -m badminton.training.train --config configs/default.yaml

cv:
	$(PYTHON) -m badminton.training.cross_validate --config configs/default.yaml

serve:
	$(PYTHON) -m uvicorn badminton.serving.app:app --reload

docker:
	docker build -t badminton-action:latest .

# Full local loop: install -> test -> synthetic data -> train.
all: dev test data train
