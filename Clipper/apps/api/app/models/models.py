import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    plan_tier = Column(String(50), default="pro")  # free, pro, business
    credits_minutes = Column(Integer, default=300)  # minutes allocated per month
    used_credits_minutes = Column(Integer, default=12)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    brand_kits = relationship("BrandKit", back_populates="user", cascade="all, delete-orphan")

class BrandKit(Base):
    __tablename__ = "brand_kits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False, default="Default Brand")
    logo_url = Column(String(1024), nullable=True)
    primary_color = Column(String(50), default="#38bdf8")
    secondary_color = Column(String(50), default="#f43f5e")
    font_family = Column(String(100), default="Montserrat Black")
    caption_template = Column(String(100), default="karaoke_pop")
    watermark_enabled = Column(Boolean, default=False)
    watermark_position = Column(String(50), default="top_right")  # top_left, top_right, bottom_left, bottom_right
    intro_video_url = Column(String(1024), nullable=True)
    outro_video_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="brand_kits")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False, default="Untitled Project")
    source_type = Column(String(50), nullable=False, default="upload")  # upload | url
    source_url = Column(String(2048), nullable=True)
    duration = Column(Float, default=0.0)
    resolution = Column(String(50), default="1920x1080")
    status = Column(String(50), default="created")  # created, downloading, transcribing, scoring, completed, failed
    progress = Column(Integer, default=0)
    stage_message = Column(String(255), default="Initializing...")
    error_message = Column(Text, nullable=True)
    
    # User Preferences & Configuration
    settings = Column(JSON, default=lambda: {
        "language": "auto",
        "clip_length_preset": "30-60s",
        "clip_count": 8,
        "timeframe_start": 0.0,
        "timeframe_end": None,
        "prompt_clip_anything": "",
        "keywords_include": [],
        "keywords_exclude": [],
        "aspect_ratio": "9:16",
        "caption_template": "karaoke_pop",
        "brand_kit_id": None
    })
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="projects")
    media = relationship("Media", back_populates="project", uselist=False, cascade="all, delete-orphan")
    clips = relationship("Clip", back_populates="project", cascade="all, delete-orphan", order_by="desc(Clip.virality_score)")

class Media(Base):
    __tablename__ = "media"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), unique=True, nullable=False)
    original_path = Column(String(1024), nullable=False)
    proxy_path = Column(String(1024), nullable=True)
    audio_path = Column(String(1024), nullable=True)
    thumbnail_path = Column(String(1024), nullable=True)
    duration = Column(Float, default=0.0)
    width = Column(Integer, default=1920)
    height = Column(Integer, default=1080)
    fps = Column(Float, default=30.0)
    
    # Word-level transcript with timestamps: [{"start": 0.5, "end": 0.9, "word": "Hello", "speaker": "Alex", "prob": 0.98}]
    transcript = Column(JSON, default=list)
    # Scene changes in seconds: [0.0, 14.5, 32.1, 48.0]
    scene_cuts = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="media")

class Clip(Base):
    __tablename__ = "clips"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    clip_index = Column(Integer, default=1)
    title = Column(String(255), nullable=False)
    hook_variants = Column(JSON, default=list)  # 3 alternative titles for A/B testing
    description = Column(Text, nullable=True)
    hashtags = Column(JSON, default=dict)  # {"tiktok": [...], "reels": [...], "shorts": [...], "linkedin": [...], "x": [...]}
    
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    
    # Virality Rubric (0-100)
    virality_score = Column(Integer, default=85)
    hook_score = Column(Integer, default=85)
    flow_score = Column(Integer, default=85)
    value_score = Column(Integer, default=85)
    trend_score = Column(Integer, default=85)
    why_it_works = Column(Text, nullable=True)
    
    # Layout and Framing
    layout = Column(String(50), default="fill")  # fill | fit | split | three_up | screen_face | gameplay
    aspect_ratio = Column(String(20), default="9:16")  # 9:16 | 1:1 | 4:5 | 16:9
    camera_offset_x = Column(Float, default=0.0)  # User manual override -1.0 to 1.0
    camera_zoom = Column(Float, default=1.0)
    
    # Captions & Styling
    caption_template = Column(String(100), default="karaoke_pop")
    caption_config = Column(JSON, default=lambda: {
        "font_family": "Montserrat",
        "font_size": 42,
        "primary_color": "#FFFFFF",
        "highlight_color": "#FACC15",
        "stroke_color": "#000000",
        "stroke_width": 3,
        "max_words_per_line": 3,
        "auto_emoji": True,
        "keyword_highlight": True,
        "position_y": 75  # percent from top
    })
    
    # Transcript segments inside this clip with words
    transcript_segments = Column(JSON, default=list)
    
    # Editing modifiers
    filler_words_removed = Column(Boolean, default=False)
    silence_removed = Column(Boolean, default=False)
    broll_tracks = Column(JSON, default=list)
    music_track = Column(JSON, nullable=True)
    
    # Export state
    exported_path = Column(String(1024), nullable=True)
    preview_url = Column(String(1024), nullable=True)
    render_status = Column(String(50), default="draft")  # draft, queued, rendering, ready, failed
    render_progress = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="clips")
    social_posts = relationship("SocialPost", back_populates="clip", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_type = Column(String(50), nullable=False)  # process_project, render_clip, export_all
    entity_id = Column(String(36), nullable=False)
    status = Column(String(50), default="queued")  # queued, running, completed, failed
    progress = Column(Integer, default=0)
    stage = Column(String(100), default="Starting")
    logs = Column(JSON, default=list)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SocialPost(Base):
    __tablename__ = "social_posts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    clip_id = Column(String(36), ForeignKey("clips.id"), nullable=False)
    platform = Column(String(50), nullable=False)  # youtube, tiktok, instagram, linkedin, x
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    status = Column(String(50), default="scheduled")  # scheduled, published, failed
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    post_url = Column(String(1024), nullable=True)
    analytics = Column(JSON, default=lambda: {"views": 0, "likes": 0, "shares": 0, "comments": 0})
    created_at = Column(DateTime, default=datetime.utcnow)

    clip = relationship("Clip", back_populates="social_posts")
