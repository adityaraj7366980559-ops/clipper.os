from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Base & Auth Schemas
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    plan_tier: str = "pro"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    credits_minutes: int
    used_credits_minutes: int
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Project & Media Schemas
class ProjectSettings(BaseModel):
    language: str = "auto"
    clip_length_preset: str = "30-60s"  # <30s, 30-60s, 60-90s, 90s-3min, custom
    clip_count: int = 8
    timeframe_start: float = 0.0
    timeframe_end: Optional[float] = None
    prompt_clip_anything: str = ""
    keywords_include: List[str] = []
    keywords_exclude: List[str] = []
    aspect_ratio: str = "9:16"
    caption_template: str = "karaoke_pop"
    brand_kit_id: Optional[str] = None

class ProjectCreateURL(BaseModel):
    url: str
    title: Optional[str] = None
    settings: Optional[ProjectSettings] = None

class MediaResponse(BaseModel):
    id: str
    original_path: str
    proxy_path: Optional[str]
    duration: float
    width: int
    height: int
    fps: float
    transcript: List[Dict[str, Any]] = []
    scene_cuts: List[float] = []
    class Config:
        from_attributes = True

# Clip Schemas
class CaptionConfig(BaseModel):
    font_family: str = "Montserrat"
    font_size: int = 42
    primary_color: str = "#FFFFFF"
    highlight_color: str = "#FACC15"
    stroke_color: str = "#000000"
    stroke_width: int = 3
    max_words_per_line: int = 3
    auto_emoji: bool = True
    keyword_highlight: bool = True
    position_y: int = 75

class ClipBase(BaseModel):
    title: str
    hook_variants: List[str] = []
    description: Optional[str] = None
    hashtags: Dict[str, List[str]] = {}
    start_time: float
    end_time: float
    duration: float
    virality_score: int
    hook_score: int
    flow_score: int
    value_score: int
    trend_score: int
    why_it_works: Optional[str] = None
    layout: str = "fill"
    aspect_ratio: str = "9:16"
    camera_offset_x: float = 0.0
    camera_zoom: float = 1.0
    caption_template: str = "karaoke_pop"
    caption_config: Dict[str, Any] = {}
    filler_words_removed: bool = False
    silence_removed: bool = False

class ClipUpdate(BaseModel):
    title: Optional[str] = None
    layout: Optional[str] = None
    aspect_ratio: Optional[str] = None
    camera_offset_x: Optional[float] = None
    camera_zoom: Optional[float] = None
    caption_template: Optional[str] = None
    caption_config: Optional[Dict[str, Any]] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    filler_words_removed: Optional[bool] = None
    silence_removed: Optional[bool] = None
    transcript_segments: Optional[List[Dict[str, Any]]] = None
    broll_tracks: Optional[List[Dict[str, Any]]] = None
    music_track: Optional[Dict[str, Any]] = None

class ClipResponse(ClipBase):
    id: str
    project_id: str
    clip_index: int
    transcript_segments: List[Dict[str, Any]] = []
    exported_path: Optional[str] = None
    preview_url: Optional[str] = None
    render_status: str
    render_progress: int
    created_at: datetime
    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: str
    title: str
    source_type: str
    source_url: Optional[str] = None
    duration: float
    resolution: str
    status: str
    progress: int
    stage_message: str
    error_message: Optional[str] = None
    settings: Dict[str, Any] = {}
    created_at: datetime
    media: Optional[MediaResponse] = None
    clips: List[ClipResponse] = []
    class Config:
        from_attributes = True

# Job & Progress Schemas
class JobResponse(BaseModel):
    id: str
    job_type: str
    entity_id: str
    status: str
    progress: int
    stage: str
    logs: List[str] = []
    error: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Brand Kit Schemas
class BrandKitBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    primary_color: str = "#38bdf8"
    secondary_color: str = "#f43f5e"
    font_family: str = "Montserrat Black"
    caption_template: str = "karaoke_pop"
    watermark_enabled: bool = False
    watermark_position: str = "top_right"
    intro_video_url: Optional[str] = None
    outro_video_url: Optional[str] = None

class BrandKitResponse(BrandKitBase):
    id: str
    user_id: str
    created_at: datetime
    class Config:
        from_attributes = True

# Social Publishing Schemas
class SocialPublishRequest(BaseModel):
    clip_id: str
    platforms: List[str]  # ["youtube", "tiktok", "instagram", "linkedin", "x"]
    scheduled_at: Optional[datetime] = None
    custom_title: Optional[str] = None
    custom_description: Optional[str] = None
    tags: Optional[List[str]] = None

class SocialPostResponse(BaseModel):
    id: str
    clip_id: str
    platform: str
    title: str
    description: Optional[str]
    tags: List[str]
    status: str
    scheduled_at: Optional[datetime]
    published_at: Optional[datetime]
    post_url: Optional[str]
    analytics: Dict[str, Any] = {}
    class Config:
        from_attributes = True

# Render & Export Request
class RenderClipRequest(BaseModel):
    resolution: str = "1080p"  # 720p, 1080p, 4k
    fps: int = 30  # 30, 60
    codec: str = "h264"  # h264, h265
    burn_captions: bool = True
    aspect_ratio: Optional[str] = None
    layout: Optional[str] = None
