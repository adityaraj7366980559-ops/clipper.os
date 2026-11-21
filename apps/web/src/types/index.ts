export interface WordToken {
  word: string;
  start: number;
  end: number;
  speaker: string;
  prob?: number;
}

export interface Clip {
  id: string;
  project_id: string;
  clip_index: number;
  title: string;
  hook_variants: string[];
  description: string;
  hashtags: Record<string, string[]>;
  start_time: number;
  end_time: number;
  duration: number;
  virality_score: number;
  hook_score: number;
  flow_score: number;
  value_score: number;
  trend_score: number;
  why_it_works: string;
  layout: string;
  aspect_ratio: string;
  camera_offset_x: number;
  camera_zoom: number;
  caption_template: string;
  caption_config: {
    font_family?: string;
    font_size?: number;
    primary_color?: string;
    highlight_color?: string;
    stroke_color?: string;
    stroke_width?: number;
    max_words_per_line?: number;
    auto_emoji?: boolean;
    keyword_highlight?: boolean;
    position_y?: number;
  };
  transcript_segments: WordToken[];
  filler_words_removed: boolean;
  silence_removed: boolean;
  broll_tracks: any[];
  music_track?: any;
  exported_path?: string;
  preview_url?: string;
  render_status: string;
  render_progress: number;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  source_type: "upload" | "url";
  source_url?: string;
  duration: number;
  resolution: string;
  status: "created" | "downloading" | "transcribing" | "scoring" | "completed" | "failed" | "processing" | string;
  progress: number;
  stage_message: string;
  error_message?: string;
  settings: {
    language?: string;
    clip_length_preset?: string;
    clip_count?: number;
    timeframe_start?: number;
    timeframe_end?: number;
    prompt_clip_anything?: string;
    keywords_include?: string[];
    keywords_exclude?: string[];
    aspect_ratio?: string;
    caption_template?: string;
    brand_kit_id?: string;
  };
  created_at: string;
  clips: Clip[];
}

export interface CaptionTemplate {
  id: string;
  name: string;
  font_family: string;
  font_size: number;
  primary_color: string;
  secondary_color: string;
  outline_color: string;
  shadow_color: string;
  outline: number;
  shadow: number;
  bold: number;
  alignment: number;
  animation: string;
}

export interface BrandKit {
  id: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  caption_template: string;
  watermark_enabled: boolean;
  watermark_position: string;
}

export interface SocialPost {
  id: string;
  clip_id: string;
  platform: "youtube" | "tiktok" | "instagram" | "linkedin" | "x";
  title: string;
  description?: string;
  tags: string[];
  status: "scheduled" | "published" | "failed";
  scheduled_at?: string;
  published_at?: string;
  post_url?: string;
  analytics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}
