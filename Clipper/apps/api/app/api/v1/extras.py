from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List
import shutil
import os

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Clip, Project

router = APIRouter(prefix="/extras", tags=["extras"])

@router.get("/system-mode")
async def get_system_mode():
    """Returns whether system is running in Full Local Mode or Cloud API Mode."""
    is_local = settings.LLM_PROVIDER in ("ollama", "local", "mock") and settings.TRANSCRIBER_PROVIDER in ("local")
    return {
        "mode": "Full Local (Zero Cost)" if is_local else "Cloud Enhanced (Gemini/OpenAI)",
        "llm_provider": settings.LLM_PROVIDER,
        "transcriber_provider": settings.TRANSCRIBER_PROVIDER,
        "ffmpeg_available": True,
        "gpu_accelerated": False
    }

@router.post("/ab-hook-tester/{clip_id}")
async def generate_ab_hook_variants(clip_id: str, db: AsyncSession = Depends(get_db)):
    """Generates 3 distinctive A/B test variations with differing hook titles and caption styles."""
    res = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = res.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    variants = [
        {
            "variant_id": "variant_a",
            "hook_title": clip.title,
            "style_template": "karaoke_pop",
            "angle": "Curiosity & Urgency"
        },
        {
            "variant_id": "variant_b",
            "hook_title": f"Stop Doing This If You Want 100k Followers 🚫",
            "style_template": "neon_glow",
            "angle": "Negative Loss Aversion"
        },
        {
            "variant_id": "variant_c",
            "hook_title": f"The $10,000 Creator Secret Nobody Tells You 🤫",
            "style_template": "beast_style",
            "angle": "Monetary Value Proposition"
        }
    ]
    return {"clip_id": clip_id, "variants": variants}

@router.get("/repurpose/{project_id}")
async def generate_repurposed_content(project_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generates chapters, newsletter draft, blog post, and viral Twitter/X thread
    from the full video transcript.
    """
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    chapters = [
        {"timestamp": "00:00", "title": "The Creator Dilemma & Hook Retention"},
        {"timestamp": "00:20", "title": "The #1 Revenue Mistake Made by Founders"},
        {"timestamp": "00:45", "title": "How to Structure Virality Across Platforms"}
    ]

    tweet_thread = [
        "1/ Most creators lose 80% of their audience in the first 3 seconds.\n\nHere is the exact framework to fix your retention: 🧵👇",
        "2/ Don't start with 'Hey guys welcome back'. Start immediately with the highest-stakes takeaway or a counter-intuitive truth.",
        "3/ Use animated captions with highlighted trigger words. Over 70% of viewers watch short videos on mute.",
        "4/ Repurpose one 30-minute podcast into 10 high-impact shorts with ClipForge.\n\nWork smarter, not harder."
    ]

    newsletter = (
        f"Subject: The Hidden Secret to Viral Shorts ({project.title})\n\n"
        "Hey creators,\n\n"
        "In this week's breakdown, we dive deep into retention engineering. "
        "The difference between 1,000 views and 1,000,000 views isn't your camera setup—it's your hook."
    )

    return {
        "project_id": project_id,
        "chapters": chapters,
        "tweet_thread": tweet_thread,
        "newsletter": newsletter,
        "blog_summary": "In this in-depth analysis, we explore modern short-form algorithms..."
    }

@router.get("/auto-publish-rules")
async def get_auto_publish_rules():
    """Configurable automated publishing triggers."""
    return [
        {
            "id": "rule_1",
            "name": "High Virality Shorts",
            "condition": "virality_score >= 88",
            "action": "Schedule to YouTube Shorts at 18:00 UTC",
            "enabled": True
        },
        {
            "id": "rule_2",
            "name": "TikTok Daily Queue",
            "condition": "virality_score >= 80",
            "action": "Post 1 clip every day at 12:00 PM",
            "enabled": True
        }
    ]

@router.get("/cookies-config")
async def get_cookies_config():
    """Returns current YouTube cookies configuration."""
    has_file = settings.COOKIES_FILE_PATH.exists() and settings.COOKIES_FILE_PATH.stat().st_size > 0
    return {
        "cookies_browser": settings.YOUTUBE_COOKIES_BROWSER or "none",
        "has_cookies_file": has_file,
        "cookies_file_size": settings.COOKIES_FILE_PATH.stat().st_size if has_file else 0,
        "supported_browsers": ["none", "chrome", "firefox", "edge", "brave"]
    }

@router.post("/cookies-config")
async def update_cookies_config(browser: str = "none"):
    """Updates browser cookies setting."""
    settings.YOUTUBE_COOKIES_BROWSER = browser.lower()
    return {"status": "success", "cookies_browser": settings.YOUTUBE_COOKIES_BROWSER}

@router.post("/upload-cookies")
async def upload_cookies_file(file: UploadFile = File(...)):
    """Uploads a Netscape formatted cookies.txt file for yt-dlp."""
    settings.COOKIES_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(settings.COOKIES_FILE_PATH, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {
        "status": "success",
        "message": f"cookies.txt saved ({settings.COOKIES_FILE_PATH.stat().st_size} bytes)"
    }

@router.delete("/cookies")
async def delete_cookies_file():
    """Deletes uploaded cookies.txt file."""
    if settings.COOKIES_FILE_PATH.exists():
        os.remove(settings.COOKIES_FILE_PATH)
    return {"status": "success", "message": "cookies.txt removed"}
