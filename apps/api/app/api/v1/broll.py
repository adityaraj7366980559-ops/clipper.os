from fastapi import APIRouter, Query
from app.services.broll.broll_service import broll_service
from app.services.audio.audio_enhancer import audio_enhancer

router = APIRouter(prefix="/media-library", tags=["media-library"])

@router.get("/broll")
async def search_broll(q: str = Query("growth", description="Keyword to find relevant video clips")):
    results = await broll_service.search_broll(q)
    return results

@router.get("/music")
async def get_background_music():
    return audio_enhancer.get_music_tracks()
