import os
import shutil
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Project, Media, Clip
from app.schemas.schemas import ProjectResponse, ProjectCreateURL
from app.tasks.pipeline import run_pipeline_for_project

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.media), selectinload(Project.clips))
        .order_by(Project.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.media), selectinload(Project.clips))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/upload", response_model=ProjectResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    language: str = Form("auto"),
    clip_length_preset: str = Form("30-60s"),
    clip_count: int = Form(8),
    prompt_clip_anything: str = Form(""),
    caption_template: str = Form("karaoke_pop"),
    aspect_ratio: str = Form("9:16"),
    db: AsyncSession = Depends(get_db)
):
    project_title = title or file.filename or "Uploaded Video"
    project = Project(
        title=project_title,
        source_type="upload",
        status="created",
        progress=0,
        stage_message="File uploaded, queued for processing...",
        settings={
            "language": language,
            "clip_length_preset": clip_length_preset,
            "clip_count": clip_count,
            "prompt_clip_anything": prompt_clip_anything,
            "caption_template": caption_template,
            "aspect_ratio": aspect_ratio
        }
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Save uploaded file to uploads directory
    save_path = str(settings.UPLOAD_DIR / f"{project.id}_{file.filename}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Dispatch background pipeline task
    background_tasks.add_task(run_pipeline_for_project, project.id, save_path)

    # Return refreshed project
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.media), selectinload(Project.clips))
        .where(Project.id == project.id)
    )
    return result.scalar_one()

@router.post("/url", response_model=ProjectResponse)
async def import_url(
    payload: ProjectCreateURL,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    from app.services.downloader.youtube_downloader import youtube_downloader
    
    # Try fetching title from video info
    title = payload.title
    if not title or title == "Imported Video":
        try:
            info = youtube_downloader.get_info(payload.url)
            title = info.get("title") or "YouTube Video"
        except Exception:
            title = "YouTube Video"

    project = Project(
        title=title,
        source_type="url",
        source_url=payload.url,
        status="created",
        progress=0,
        stage_message="Queued for download...",
        settings=payload.settings.dict() if payload.settings else {}
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Dispatch pipeline directly (pipeline handles downloading stage)
    background_tasks.add_task(run_pipeline_for_project, project.id, None)

    result = await db.execute(
        select(Project)
        .options(selectinload(Project.media), selectinload(Project.clips))
        .where(Project.id == project.id)
    )
    return result.scalar_one()

@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
    return {"success": True, "message": "Project deleted successfully"}
