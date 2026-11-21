from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.projects import router as projects_router
from app.api.v1.clips import router as clips_router
from app.api.v1.templates import router as templates_router
from app.api.v1.brand import router as brand_router
from app.api.v1.publish import router as publish_router
from app.api.v1.broll import router as broll_router
from app.api.v1.billing import router as billing_router
from app.api.v1.extras import router as extras_router
from app.tasks.pipeline import ACTIVE_SOCKETS

@asynccontextmanager
async def lifespan(app: FastAPI):
    import shutil
    import yt_dlp
    from app.services.downloader.youtube_downloader import youtube_downloader

    # 1. Check yt-dlp version
    ytdlp_ver = getattr(yt_dlp.version, "__version__", "unknown")
    print(f"[ClipForge Startup] yt-dlp version: {ytdlp_ver}")

    # 2. Check ffmpeg and ffprobe on PATH
    ffmpeg_bin = shutil.which("ffmpeg")
    ffprobe_bin = shutil.which("ffprobe")
    if not ffmpeg_bin:
        raise RuntimeError(
            "FATAL: ffmpeg is not installed or not on system PATH!\n"
            "Installation instructions:\n"
            "  - Windows: winget install Gyan.FFmpeg (or download from https://gyan.dev/ffmpeg/builds/)\n"
            "  - macOS: brew install ffmpeg\n"
            "  - Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y ffmpeg\n"
        )
    if not ffprobe_bin:
        raise RuntimeError(
            "FATAL: ffprobe is not installed or not on system PATH!\n"
            "Ensure the ffmpeg/bin folder containing ffprobe.exe is added to system PATH."
        )
    print(f"[ClipForge Startup] FFmpeg verified: {ffmpeg_bin}")
    print(f"[ClipForge Startup] FFprobe verified: {ffprobe_bin}")

    # 3. Check JavaScript runtime for yt-dlp
    node_bin = youtube_downloader.node_path
    if node_bin:
        print(f"[ClipForge Startup] JavaScript runtime detected for yt-dlp: {node_bin}")
    else:
        print("[ClipForge Startup] Warning: No Node.js or Deno found. YouTube challenge execution may be limited.")

    # Initialize database tables on startup
    await init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ClipForge - Enterprise AI Video Clipping & Virality Repurposing Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts for media streaming
app.mount("/static/proxies", StaticFiles(directory=str(settings.PROXY_DIR)), name="proxies")
app.mount("/static/exports", StaticFiles(directory=str(settings.EXPORT_DIR)), name="exports")
app.mount("/static/cache", StaticFiles(directory=str(settings.CACHE_DIR)), name="cache")

# Mount API Routers
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(clips_router, prefix=settings.API_V1_STR)
app.include_router(templates_router, prefix=settings.API_V1_STR)
app.include_router(brand_router, prefix=settings.API_V1_STR)
app.include_router(publish_router, prefix=settings.API_V1_STR)
app.include_router(broll_router, prefix=settings.API_V1_STR)
app.include_router(billing_router, prefix=settings.API_V1_STR)
app.include_router(extras_router, prefix=settings.API_V1_STR)

@app.websocket("/ws/progress")
async def websocket_progress(websocket: WebSocket):
    """Real-time live progress updates for video processing & rendering."""
    await websocket.accept()
    ACTIVE_SOCKETS.add(websocket)
    try:
        while True:
            # Keep-alive ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ACTIVE_SOCKETS.discard(websocket)
    except Exception:
        ACTIVE_SOCKETS.discard(websocket)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
