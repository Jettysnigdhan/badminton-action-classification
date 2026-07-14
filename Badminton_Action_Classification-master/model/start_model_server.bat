@echo off
REM Launch the Python FastAPI model server for badminton action classification.
REM Run this BEFORE (or alongside) `npm run dev` so the Next.js app can
REM forward video uploads to the real ML model.
REM
REM Usage:
REM   start_model_server.bat            # default: port 8000, cpu
REM   set PORT=8080 && start_model_server.bat  # override port

setlocal enabledelayedexpansion

REM ---- paths ------------------------------------------------------------------
set SCRIPT_DIR=%~dp0
set ML_PROJECT=%SCRIPT_DIR%
set VENV=%ML_PROJECT%\.venv\Scripts
set MODEL=%ML_PROJECT%\model.pt

if not exist "%MODEL%" (
    echo ERROR: model.pt not found at %MODEL%
    exit /b 1
)

REM ---- env --------------------------------------------------------------------
set MODEL_PATH=%MODEL%
set PYTHONPATH=%ML_PROJECT%\src;%PYTHONPATH%
if not defined POSE_DEVICE set POSE_DEVICE=cpu
if not defined POSE_MODE set POSE_MODE=balanced

if not defined PORT set PORT=8000

echo Starting model server on http://127.0.0.1:%PORT%
echo     MODEL_PATH  = %MODEL_PATH%
echo     POSE_DEVICE = %POSE_DEVICE%
echo     POSE_MODE   = %POSE_MODE%
echo.

"%VENV%\uvicorn" badminton.serving.app:app --host 127.0.0.1 --port %PORT% --log-level info
