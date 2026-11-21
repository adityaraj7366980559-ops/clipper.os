import asyncio
import os
import pytest
from app.core.database import init_db, AsyncSessionLocal
from app.models.models import Project, Clip
from app.tasks.pipeline import run_pipeline_for_project
from sqlalchemy import select

@pytest.mark.asyncio
async def test_sample_pipeline():
    await init_db()
    # Check current directory or parent workspace for sample video
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_podcast.mp4")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "sample_podcast.mp4")),
    ]
    sample_video = next((p for p in candidates if os.path.exists(p)), None)
    if not sample_video:
        # Generate on the fly if needed
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
        from sample_generator import generate_sample_video
        sample_video = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_podcast.mp4"))
        generate_sample_video(sample_video, duration=15.0)

    assert os.path.exists(sample_video), f"sample_podcast.mp4 must exist at {sample_video}"

    async with AsyncSessionLocal() as db:
        project = Project(
            title="E2E Test Podcast",
            source_type="upload",
            status="created",
            settings={
                "clip_length_preset": "30-60s",
                "clip_count": 3,
                "caption_template": "karaoke_pop",
                "aspect_ratio": "9:16"
            }
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        proj_id = project.id

    # Run the complete pipeline
    await run_pipeline_for_project(proj_id, sample_video)

    # Verify results
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Project).where(Project.id == proj_id))
        updated_project = res.scalar_one()
        assert updated_project.status == "completed", f"Pipeline failed: {updated_project.error_message}"
        assert updated_project.progress == 100

        clips_res = await db.execute(select(Clip).where(Clip.project_id == proj_id))
        clips = clips_res.scalars().all()
        assert len(clips) > 0, "At least one viral clip must be generated"
        for c in clips:
            assert c.virality_score >= 60
            assert c.title
            assert len(c.hook_variants) > 0
            assert c.duration > 0
            safe_title = c.title.encode("ascii", "replace").decode("ascii")
            print(f"Verified Clip: {safe_title} | Score: {c.virality_score}/100 | Duration: {c.duration}s")

if __name__ == "__main__":
    asyncio.run(test_sample_pipeline())
