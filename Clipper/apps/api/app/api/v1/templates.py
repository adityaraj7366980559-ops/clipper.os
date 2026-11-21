from fastapi import APIRouter
from app.services.captions.caption_engine import CAPTION_TEMPLATES

router = APIRouter(prefix="/templates", tags=["templates"])

@router.get("")
async def get_caption_templates():
    """Returns the library of 25+ rich animated caption templates."""
    results = []
    for key, val in CAPTION_TEMPLATES.items():
        results.append({
            "id": key,
            **val
        })
    return results
