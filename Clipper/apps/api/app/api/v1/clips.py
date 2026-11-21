import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Clip, Project, Media
from app.schemas.schemas import ClipResponse, ClipUpdate, RenderClipRequest
from app.services.video.ffmpeg_service import ffmpeg_service
from app.services.captions.caption_engine import caption_engine

router = APIRouter(prefix="/clips", tags=["clips"])

@router.get("/{clip_id}", response_model=ClipResponse)
async def get_clip(clip_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    return clip

@router.patch("/{clip_id}", response_model=ClipResponse)
async def update_clip(
    clip_id: str,
    payload: ClipUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(clip, field, val)

    if payload.start_time is not None or payload.end_time is not None:
        clip.duration = round(clip.end_time - clip.start_time, 2)

    await db.commit()
    await db.refresh(clip)
    return clip

@router.post("/{clip_id}/render", response_model=ClipResponse)
async def render_clip_export(
    clip_id: str,
    payload: RenderClipRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Clip).options(selectinload(Clip.project)).where(Clip.id == clip_id)
    )
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip.render_status = "rendering"
    clip.render_progress = 15
    await db.commit()

    async def execute_render(c_id: str, req: RenderClipRequest):
        async with AsyncSessionLocal() as session:
            c = (await session.execute(
                select(Clip).options(selectinload(Clip.project)).where(Clip.id == c_id)
            )).scalar_one()

            m_res = await session.execute(
                select(Media).where(Media.project_id == c.project_id)
            )
            media = m_res.scalar_one_or_none()
            input_file = media.original_path if media else "sample_podcast.mp4"

            out_file = str(settings.EXPORT_DIR / f"export_{c.id}.mp4")
            ass_path = None
            if req.burn_captions and c.transcript_segments:
                ass_path = str(settings.CACHE_DIR / f"{c.id}_render.ass")
                caption_engine.generate_ass(
                    words=c.transcript_segments,
                    output_path=ass_path,
                    template_key=c.caption_template,
                    clip_start_offset=c.start_time,
                    position_y=c.caption_config.get("position_y", 75)
                )

            try:
                ffmpeg_service.render_clip(
                    input_path=input_file,
                    output_path=out_file,
                    start_time=c.start_time,
                    end_time=c.end_time,
                    aspect_ratio=req.aspect_ratio or c.aspect_ratio,
                    layout=req.layout or c.layout,
                    camera_offset_x=c.camera_offset_x,
                    ass_subtitle_path=ass_path,
                    resolution=req.resolution,
                    fps=req.fps,
                    codec=req.codec
                )
                c.exported_path = out_file
                c.preview_url = f"/api/v1/clips/stream/export/{c.id}"
                c.render_status = "ready"
                c.render_progress = 100
            except Exception as e:
                c.render_status = "failed"
                print(f"[RenderClip] Error: {e}")
            await session.commit()

    from app.core.database import AsyncSessionLocal
    background_tasks.add_task(execute_render, clip.id, payload)
    return clip

@router.get("/{clip_id}/subtitles/{sub_format}")
async def export_subtitles(
    clip_id: str,
    sub_format: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip or not clip.transcript_segments:
        raise HTTPException(status_code=404, detail="Clip transcript not found")

    fmt = sub_format.lower()
    if fmt == "srt":
        srt_path = str(settings.CACHE_DIR / f"{clip.id}.srt")
        caption_engine.generate_srt(clip.transcript_segments, srt_path, clip_start_offset=clip.start_time)
        return FileResponse(srt_path, media_type="text/plain", filename=f"{clip.title}.srt")

    elif fmt == "ass":
        ass_path = str(settings.CACHE_DIR / f"{clip.id}.ass")
        caption_engine.generate_ass(
            clip.transcript_segments, ass_path, template_key=clip.caption_template, clip_start_offset=clip.start_time
        )
        return FileResponse(ass_path, media_type="text/plain", filename=f"{clip.title}.ass")

    elif fmt == "txt":
        full_text = " ".join(t.get("word", "") for t in clip.transcript_segments)
        return Response(content=full_text, media_type="text/plain")

    else:
        raise HTTPException(status_code=400, detail="Supported formats: srt, ass, txt")

@router.get("/stream/{project_id}/{clip_index}")
async def stream_clip(project_id: str, clip_index: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Clip).where(Clip.project_id == project_id, Clip.clip_index == clip_index)
    )
    clip = result.scalar_one_or_none()
    if not clip or not clip.exported_path or not os.path.exists(clip.exported_path):
        sample_path = os.path.abspath("sample_podcast.mp4")
        if os.path.exists(sample_path):
            return FileResponse(sample_path, media_type="video/mp4")
        raise HTTPException(status_code=404, detail="Clip video file not found")
    return FileResponse(clip.exported_path, media_type="video/mp4")

@router.get("/stream/export/{clip_id}")
async def stream_exported_clip(clip_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip or not clip.exported_path or not os.path.exists(clip.exported_path):
        raise HTTPException(status_code=404, detail="Exported video file not found")
    return FileResponse(clip.exported_path, media_type="video/mp4")
