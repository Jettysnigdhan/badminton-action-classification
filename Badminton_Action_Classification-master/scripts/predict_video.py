#!/usr/bin/env python3
"""Post a local video file to the website classify endpoint and print the result.

Usage:
  python scripts/predict_video.py --file "C:\path\to\video.mp4"
  python scripts/predict_video.py --file /home/user/video.mp4 --url http://127.0.0.1:8000/v1/predict/video

By default this posts to the website's classify route on localhost:3000.
"""
from __future__ import annotations

import argparse
import sys
import requests


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True, help="Path to local video file (mp4)")
    ap.add_argument(
        "--url",
        default="http://localhost:3000/api/classify",
        help="Endpoint to POST the file to (default: website /api/classify)",
    )
    args = ap.parse_args()

    path = args.file
    url = args.url

    try:
        with open(path, "rb") as fh:
            files = {"file": (path.split("\\")[-1], fh, "video/mp4")}
            print(f"Posting {path} -> {url} ...")
            resp = requests.post(url, files=files, timeout=120)
    except FileNotFoundError:
        print(f"File not found: {path}")
        return 2
    except Exception as e:
        print("Error posting file:", e)
        return 3

    try:
        print("Status:", resp.status_code)
        print(resp.headers)
        print("Response JSON:\n", resp.json())
    except Exception:
        print("Response body:\n", resp.text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
