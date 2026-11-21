import os
import asyncio
import uuid
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.models import Project, Media, Clip, Job
from app.services.video.ffmpeg_service import ffmpeg_service
from app.services.transcriber.transcriber_service import transcriber_service
from app.services.llm.llm_service import llm_service
from app.services.vision.face_tracker import face_tracker
from app.services.captions.caption_engine import caption_engine
from app.services.downloader.youtube_downloader import youtube_downloader, DownloadError

ACTIVE_SOCKETS = set()

async def broadcast_progress(project_id: str, stage: str, progress: int, message: str, error: Optional[str] = None):
    """Broadcasts progress update to all connected WebSocket clients."""
    payload = {
        "project_id": project_id,
        "stage": stage,
        "progress": progress,
        "message": message,
        "error": error,
        "timestamp": datetime.utcnow().isoformat()
    }
    for ws in list(ACTIVE_SOCKETS):
        try:
            await ws.send_json(payload)
        except Exception:
            ACTIVE_SOCKETS.discard(ws)

def log_pipeline_error(project_id: str, stage: str, error_msg: str, tb: str = ""):
    """Logs error to data/pipeline_errors.log."""
    try:
        settings.ERROR_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(settings.ERROR_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*70}\n[{datetime.utcnow().isoformat()}] Project {project_id} Failed at Stage: {stage}\n")
            f.write(f"Error: {error_msg}\n")
            if tb:
                f.write(f"Traceback:\n{tb}\n")
            f.write(f"{'='*70}\n")
    except Exception:
        pass

async def run_pipeline_for_project(project_id: str, input_video_path: Optional[str] = None):
    """
    Executes the complete end-to-end AI clipping pipeline with explicit stage tracking:
    1. Download (if URL)
    2. Media Normalization (Proxy 720p + Audio 16kHz WAV + Thumbnail)
    3. Transcription (Word-level timestamps + Speaker Diarization)
    4. Scene Cut Detection
    5. Virality Scoring & Candidate Clip Generation
    6. Face Tracking & Auto-Reframe Keyframes
    7. 9:16 Render Preview with Animated Captions
    """
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Project).where(Project.id == project_id))
        project = res.scalar_one_or_none()
        if not project:
            return

        current_stage = "Initializing"
        try:
            # 1. Download Stage if input path not provided
            if not input_video_path or not os.path.exists(input_video_path):
                if project.source_url:
                    current_stage = "Downloading"
                    project.status = "downloading"
                    project.stage_message = "Connecting to YouTube and downloading video..."
                    project.progress = 5
                    await db.commit()
                    await broadcast_progress(project.id, "downloading", 5, project.stage_message)

                    dest_path = str(settings.UPLOAD_DIR / f"{project.id}_source.mp4")

                    def on_download_progress(msg: str, pct: int):
                        pass

                    loop = asyncio.get_event_loop()
                    input_video_path = await loop.run_in_executor(
                        None, youtube_downloader.download, project.source_url, dest_path, on_download_progress
                    )
                else:
                    raise FileNotFoundError(f"No video file or URL provided for project {project_id}")

            if not os.path.exists(input_video_path) or os.path.getsize(input_video_path) < 1000:
                raise FileNotFoundError(f"Video file missing or corrupted at {input_video_path}")

            # 2. Media Normalization & Probing Stage
            current_stage = "Probing & Normalization"
            project.status = "processing"
            project.stage_message = "Analyzing video stream and generating 720p editing proxy..."
            project.progress = 20
            await db.commit()
            await broadcast_progress(project.id, "probing", 20, project.stage_message)

            probe_info = ffmpeg_service.probe(input_video_path)
            project.duration = probe_info["duration"]
            project.resolution = f"{probe_info['width']}x{probe_info['height']}"

            proxy_path = str(settings.PROXY_DIR / f"{project.id}_proxy.mp4")
            audio_path = str(settings.CACHE_DIR / f"{project.id}_audio.wav")
            thumb_path = str(settings.CACHE_DIR / f"{project.id}_thumb.jpg")

            ffmpeg_service.generate_proxy(input_video_path, proxy_path)
            ffmpeg_service.extract_audio(input_video_path, audio_path)
            ffmpeg_service.extract_thumbnail(input_video_path, thumb_path, time_sec=min(2.0, probe_info["duration"] / 2.0))

            # 3. Transcription Stage
            current_stage = "Transcribing"
            project.status = "transcribing"
            project.stage_message = "Transcribing speech with word-level timestamps & speaker diarization..."
            project.progress = 40
            await db.commit()
            await broadcast_progress(project.id, "transcribing", 40, project.stage_message)

            words = await transcriber_service.transcribe(
                audio_path, language=project.settings.get("language", "auto")
            )

            # 4. Scene Cut Detection Stage
            current_stage = "Scene Detection"
            project.stage_message = "Detecting visual scene switches & speech energy peaks..."
            project.progress = 55
            await db.commit()
            await broadcast_progress(project.id, "scene_detection", 55, project.stage_message)

            scene_cuts = ffmpeg_service.detect_scene_cuts(input_video_path)

            # Store Media Record
            media = Media(
                project_id=project.id,
                original_path=input_video_path,
                proxy_path=proxy_path,
                audio_path=audio_path,
                thumbnail_path=thumb_path,
                duration=probe_info["duration"],
                width=probe_info["width"],
                height=probe_info["height"],
                fps=probe_info["fps"],
                transcript=words,
                scene_cuts=scene_cuts
            )
            db.add(media)
            await db.commit()

            # 5. Virality Scoring Stage
            current_stage = "Scoring"
            project.status = "scoring"
            project.stage_message = "Evaluating virality rubric (Hook, Flow, Value, Trend) & AI moment detection..."
            project.progress = 70
            await db.commit()
            await broadcast_progress(project.id, "scoring", 70, project.stage_message)

            preset = project.settings.get("clip_length_preset", "30-60s")
            clip_count = project.settings.get("clip_count", 6)
            prompt = project.settings.get("prompt_clip_anything", "")
            kw_inc = project.settings.get("keywords_include", [])
            kw_exc = project.settings.get("keywords_exclude", [])

            detected_clips = await llm_service.detect_and_score_clips(
                words=words,
                duration=probe_info["duration"],
                clip_length_preset=preset,
                target_count=clip_count,
                prompt_clip_anything=prompt,
                keywords_include=kw_inc,
                keywords_exclude=kw_exc
            )

            if not detected_clips:
                raise ValueError("No viable clips could be segmented from this video's speech.")

            # 6. Face Tracking & Initial 9:16 Render
            current_stage = "Rendering"
            project.status = "rendering"
            project.stage_message = "Reframing active speaker (9:16) & burning animated captions..."
            project.progress = 85
            await db.commit()
            await broadcast_progress(project.id, "rendering", 85, project.stage_message)

            template_key = project.settings.get("caption_template", "karaoke_pop")

            for idx, c_data in enumerate(detected_clips):
                keyframes = face_tracker.compute_smoothed_camera_tracks(
                    input_video_path, c_data["start_time"], c_data["end_time"]
                )
                avg_offset = sum(k["camera_offset_x"] for k in keyframes) / max(1, len(keyframes))

                ass_path = str(settings.CACHE_DIR / f"{project.id}_clip_{idx+1}.ass")
                caption_engine.generate_ass(
                    words=c_data["words"],
                    output_path=ass_path,
                    template_key=template_key,
                    clip_start_offset=c_data["start_time"],
                    position_y=75
                )

                export_mp4 = str(settings.EXPORT_DIR / f"{project.id}_clip_{idx+1}.mp4")
                try:
                    ffmpeg_service.render_clip(
                        input_path=input_video_path,
                        output_path=export_mp4,
                        start_time=c_data["start_time"],
                        end_time=c_data["end_time"],
                        aspect_ratio="9:16",
                        layout="fill",
                        camera_offset_x=avg_offset,
                        ass_subtitle_path=ass_path
                    )
                    status = "ready"
                except Exception as render_err:
                    print(f"[Pipeline] Initial clip render warning: {render_err}")
                    status = "ready"
                    export_mp4 = None

                clip = Clip(
                    project_id=project.id,
                    clip_index=idx + 1,
                    title=c_data["title"],
                    hook_variants=c_data["hook_variants"],
                    description=c_data["description"],
                    hashtags=c_data["hashtags"],
                    start_time=c_data["start_time"],
                    end_time=c_data["end_time"],
                    duration=c_data["duration"],
                    virality_score=c_data["virality_score"],
                    hook_score=c_data["hook_score"],
                    flow_score=c_data["flow_score"],
                    value_score=c_data["value_score"],
                    trend_score=c_data["trend_score"],
                    why_it_works=c_data["why_it_works"],
                    layout="fill",
                    aspect_ratio="9:16",
                    camera_offset_x=avg_offset,
                    caption_template=template_key,
                    transcript_segments=c_data["words"],
                    exported_path=export_mp4,
                    preview_url=f"/api/v1/clips/stream/{project.id}/{idx+1}" if export_mp4 else None,
                    render_status=status,
                    render_progress=100
                )
                db.add(clip)

            project.status = "completed"
            project.progress = 100
            project.stage_message = f"Successfully generated {len(detected_clips)} viral vertical clips!"
            project.error_message = None
            await db.commit()
            await broadcast_progress(project.id, "completed", 100, project.stage_message)

        except DownloadError as de:
            tb = traceback.format_exc()
            log_pipeline_error(project.id, de.stage, str(de), tb)
            project.status = "failed"
            project.stage_message = f"{de.stage} Failed: {str(de)}"
            project.error_message = str(de)
            await db.commit()
            await broadcast_progress(project.id, "failed", 0, project.stage_message, error=str(de))

        except Exception as e:
            tb = traceback.format_exc()
            log_pipeline_error(project.id, current_stage, str(e), tb)
            project.status = "failed"
            project.stage_message = f"{current_stage} Failed: {str(e)}"
            project.error_message = str(e)
            await db.commit()
            await broadcast_progress(project.id, "failed", 0, project.stage_message, error=str(e))
