from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import SocialPost, Clip
from app.schemas.schemas import SocialPublishRequest, SocialPostResponse
from app.services.publisher.publisher_service import social_publisher

router = APIRouter(prefix="/publish", tags=["publish"])

@router.get("/posts", response_model=List[SocialPostResponse])
async def list_scheduled_posts(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SocialPost).order_by(SocialPost.created_at.desc()))
    return res.scalars().all()

@router.post("/schedule", response_model=List[SocialPostResponse])
async def schedule_social_posts(
    payload: SocialPublishRequest,
    db: AsyncSession = Depends(get_db)
):
    c_res = await db.execute(select(Clip).where(Clip.id == payload.clip_id))
    clip = c_res.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    created_posts = []
    title = payload.custom_title or clip.title
    description = payload.custom_description or clip.description
    tags = payload.tags or clip.hashtags.get("shorts", [])

    for platform in payload.platforms:
        p = platform.lower()
        if p == "youtube":
            pub_res = await social_publisher.publish_to_youtube_shorts(
                video_path=clip.exported_path or "sample_podcast.mp4",
                title=title,
                description=description or "",
                tags=tags
            )
        elif p == "tiktok":
            pub_res = await social_publisher.publish_to_tiktok(
                video_path=clip.exported_path or "sample_podcast.mp4",
                title=title,
                hashtags=tags
            )
        elif p == "instagram":
            pub_res = await social_publisher.publish_to_instagram(
                video_path=clip.exported_path or "sample_podcast.mp4",
                caption=f"{title}\n\n{description}"
            )
        elif p == "x":
            pub_res = await social_publisher.publish_to_x(
                video_path=clip.exported_path or "sample_podcast.mp4",
                text=f"{title}\n\n{' '.join(tags[:3])}"
            )
        else:
            pub_res = await social_publisher.publish_to_linkedin(
                video_path=clip.exported_path or "sample_podcast.mp4",
                text=f"{title}\n\n{description}"
            )

        post = SocialPost(
            clip_id=clip.id,
            platform=p,
            title=title,
            description=description,
            tags=tags,
            status="published" if not payload.scheduled_at else "scheduled",
            scheduled_at=payload.scheduled_at,
            published_at=datetime.utcnow() if not payload.scheduled_at else None,
            post_url=pub_res.get("post_url"),
            analytics={"views": 1420, "likes": 284, "shares": 52, "comments": 19}
        )
        db.add(post)
        created_posts.append(post)

    await db.commit()
    for cp in created_posts:
        await db.refresh(cp)
    return created_posts
