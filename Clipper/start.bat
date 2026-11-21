@echo off
TITLE ClipForge Launcher
echo ========================================================
echo               CLIPFORGE - AI VIDEO CLIPPING
echo ========================================================
echo.

REM Ensure Python Virtual Environment exists
if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Creating virtual environment with Python 3.11...
    uv venv .venv --python 3.11
    uv pip install --native-tls --python .venv\Scripts\python.exe -r requirements.txt
)

echo [2/3] Starting FastAPI Backend on http://localhost:8000...
start "ClipForge API" cmd /k "set PYTHONPATH=apps\api&& set PYTHONIOENCODING=utf-8&& .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [3/3] Starting Next.js Web Frontend on http://localhost:3000...
start "ClipForge Web" cmd /k "cd apps\web&& npm.cmd run dev"

echo.
echo ========================================================
echo   ClipForge is starting!
echo   Web Studio:    http://localhost:3000
echo   API Swagger:   http://localhost:8000/docs
echo ========================================================
pause
