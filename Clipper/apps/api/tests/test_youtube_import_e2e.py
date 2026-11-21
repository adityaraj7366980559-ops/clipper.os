import asyncio
import os
import pytest
from sqlalchemy import select
from app.core.database import init_db, AsyncSessionLocal
from app.models.models import Project, Clip
from app.tasks.pipeline import run_pipeline_for_project

@pytest.mark.asyncio
async def test_youtube_import_and_clip_production():
    """
    End-to-end test that downloads a short public video from YouTube,
    runs the full clipping pipeline, and asserts that at least one clip MP4 file is generated.
    """
    await init_db()

    # Short public YouTube video: "Me at the zoo" (19 seconds)
    youtube_url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"

    async with AsyncSessionLocal() as db:
        project = Project(
            title="YouTube E2E Test - Me at the zoo",
            source_type="url",
            source_url=youtube_url,
            status="created",
            settings={
                "clip_length_preset": "<30s",
                "clip_count": 2,
                "caption_template": "karaoke_pop",
                "aspect_ratio": "9:16"
            }
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        proj_id = project.id

    # Run the full pipeline (downloads from YouTube, transcribes, scores, reframes, renders)
    await run_pipeline_for_project(proj_id, None)

    # Verification
    async with AsyncSessionLocal() as db:
        p_res = await db.execute(select(Project).where(Project.id == proj_id))
        proj = p_res.scalar_one()

        assert proj.status == "completed", f"Pipeline failed: {proj.stage_message} | Error: {proj.error_message}"
        assert proj.progress == 100

        c_res = await db.execute(select(Clip).where(Clip.project_id == proj_id))
        clips = c_res.scalars().all()

        assert len(clips) >= 1, "At least one viral clip must be produced from the YouTube video"

        clip = clips[0]
        assert clip.exported_path is not None, "Clip must have an exported_path"
        assert os.path.exists(clip.exported_path), f"Rendered clip file must exist on disk: {clip.exported_path}"
        assert os.path.getsize(clip.exported_path) > 1000, "Rendered clip file must not be empty"

        safe_title = clip.title.encode("ascii", "replace").decode("ascii")
        print(f"SUCCESS: Generated clip '{safe_title}' ({clip.duration}s) at {clip.exported_path}")

if __name__ == "__main__":
    asyncio.run(test_youtube_import_and_clip_production())
