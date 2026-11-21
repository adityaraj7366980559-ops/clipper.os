import os
import json
import subprocess
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings

class FFmpegService:
    def __init__(self):
        self.ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"
        self.ffprobe_bin = shutil.which("ffprobe") or "ffprobe"

    def probe(self, file_path: str) -> Dict[str, Any]:
        """Probes video metadata using ffprobe."""
        cmd = [
            self.ffprobe_bin,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            file_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"ffprobe failed: {res.stderr}")
        
        data = json.loads(res.stdout)
        video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
        audio_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
        
        duration = float(data.get("format", {}).get("duration", 0.0))
        width = int(video_stream.get("width", 1920)) if video_stream else 1920
        height = int(video_stream.get("height", 1080)) if video_stream else 1080
        
        # Parse fps
        fps = 30.0
        if video_stream and "r_frame_rate" in video_stream:
            r = video_stream["r_frame_rate"].split('/')
            if len(r) == 2 and float(r[1]) > 0:
                fps = float(r[0]) / float(r[1])
            elif len(r) == 1:
                fps = float(r[0])
                
        return {
            "duration": duration,
            "width": width,
            "height": height,
            "fps": round(fps, 2),
            "video_codec": video_stream.get("codec_name") if video_stream else None,
            "audio_codec": audio_stream.get("codec_name") if audio_stream else None,
            "bitrate": int(data.get("format", {}).get("bit_rate", 0))
        }

    def generate_proxy(self, input_path: str, output_path: str) -> str:
        """Generates a fast 720p H.264 MP4 proxy with faststart for fluid web scrubbing."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cmd = [
            self.ffmpeg_bin, "-y",
            "-i", input_path,
            "-vf", "scale=-2:720",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "24",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            output_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"Proxy generation failed: {res.stderr}")
        return output_path

    def extract_audio(self, input_path: str, output_wav: str) -> str:
        """Extracts 16kHz mono 16-bit PCM WAV for speech processing and silence analysis."""
        os.makedirs(os.path.dirname(output_wav), exist_ok=True)
        cmd = [
            self.ffmpeg_bin, "-y",
            "-i", input_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            output_wav
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"Audio extraction failed: {res.stderr}")
        return output_wav

    def extract_thumbnail(self, input_path: str, output_jpg: str, time_sec: float = 2.0) -> str:
        """Captures a clean JPG frame at time_sec."""
        os.makedirs(os.path.dirname(output_jpg), exist_ok=True)
        cmd = [
            self.ffmpeg_bin, "-y",
            "-ss", str(time_sec),
            "-i", input_path,
            "-vframes", "1",
            "-q:v", "2",
            output_jpg
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"Thumbnail extraction failed: {res.stderr}")
        return output_jpg

    def detect_scene_cuts(self, input_path: str, threshold: float = 0.35) -> List[float]:
        """Detects hard scene changes using ffmpeg select filter."""
        cmd = [
            self.ffmpeg_bin,
            "-i", input_path,
            "-filter_complex", f"select='gt(scene,{threshold})',metadata=print:file=-",
            "-f", "null", "-"
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        timestamps = [0.0]
        for line in res.stdout.splitlines():
            if "pts_time:" in line:
                try:
                    t = float(line.split("pts_time:")[1].strip().split()[0])
                    if not timestamps or (t - timestamps[-1]) > 1.0:
                        timestamps.append(round(t, 2))
                except Exception:
                    pass
        return timestamps

    def build_crop_filter(
        self,
        src_w: int,
        src_h: int,
        aspect_ratio: str = "9:16",
        layout: str = "fill",
        camera_offset_x: float = 0.0,
        camera_zoom: float = 1.0
    ) -> str:
        """
        Builds high-performance FFmpeg video filter for auto-reframe layouts:
        - 9:16 Fill: Damped virtual camera centering on active speaker
        - 9:16 Fit: Original 16:9 in center with blurred mirrored background
        - Split: Two speakers stacked top & bottom
        - 1:1, 4:5, 16:9
        """
        target_w, target_h = (1080, 1920) if aspect_ratio == "9:16" else (
            (1080, 1080) if aspect_ratio == "1:1" else (
                (1080, 1350) if aspect_ratio == "4:5" else (1920, 1080)
            )
        )
        
        if layout == "fit" and aspect_ratio == "9:16":
            # Blurred background fill + scaled original in center
            return (
                f"[0:v] split=2 [fg][bg];"
                f"[bg] scale={target_w}:{target_h}:force_original_aspect_ratio=increase,"
                f"crop={target_w}:{target_h},boxblur=luma_radius=min(h\\,w)/15:luma_power=3 [blurred_bg];"
                f"[fg] scale={target_w}:-2 [scaled_fg];"
                f"[blurred_bg][scaled_fg] overlay=(W-w)/2:(H-h)/2 [reframe_out]"
            )
            
        elif layout == "split" and aspect_ratio == "9:16":
            # Stack top half (left speaker) and bottom half (right speaker)
            half_h = target_h // 2
            return (
                f"[0:v] split=2 [spk1][spk2];"
                f"[spk1] crop=ih*9/16:ih:0:0,scale={target_w}:{half_h} [top];"
                f"[spk2] crop=ih*9/16:ih:iw-ih*9/16:0,scale={target_w}:{half_h} [bottom];"
                f"[top][bottom] vstack [reframe_out]"
            )
            
        else:
            # Default Fill: Center crop with horizontal camera offset
            crop_w = int(src_h * (target_w / target_h) / max(0.5, camera_zoom))
            crop_h = int(src_h / max(0.5, camera_zoom))
            max_x = max(0, src_w - crop_w)
            
            # Map camera_offset_x (-1.0 to 1.0) across horizontal range
            center_x = max_x / 2.0
            x_pos = int(center_x + (camera_offset_x * (max_x / 2.0)))
            x_pos = max(0, min(max_x, x_pos))
            y_pos = int(max(0, (src_h - crop_h) / 2.0))
            
            return f"[0:v] crop={crop_w}:{crop_h}:{x_pos}:{y_pos},scale={target_w}:{target_h} [reframe_out]"

    def render_clip(
        self,
        input_path: str,
        output_path: str,
        start_time: float,
        end_time: float,
        aspect_ratio: str = "9:16",
        layout: str = "fill",
        camera_offset_x: float = 0.0,
        camera_zoom: float = 1.0,
        ass_subtitle_path: Optional[str] = None,
        watermark_path: Optional[str] = None,
        watermark_pos: str = "top_right",
        resolution: str = "1080p",
        fps: int = 30,
        codec: str = "h264"
    ) -> str:
        """
        Renders the final professional clip:
        - Precise sub-second cut
        - Layout & auto-reframe
        - Burned animated ASS subtitles
        - Watermark overlay
        - Loudness normalization (-14 LUFS)
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        probe_info = self.probe(input_path)
        src_w = probe_info["width"]
        src_h = probe_info["height"]
        
        filter_str = self.build_crop_filter(
            src_w, src_h,
            aspect_ratio=aspect_ratio,
            layout=layout,
            camera_offset_x=camera_offset_x,
            camera_zoom=camera_zoom
        )
        
        current_v = "[reframe_out]"
        
        # Add ASS subtitles if provided
        if ass_subtitle_path and os.path.exists(ass_subtitle_path):
            escaped_ass = ass_subtitle_path.replace("\\", "/").replace(":", "\\:")
            filter_str += f";{current_v} ass='{escaped_ass}' [with_sub]"
            current_v = "[with_sub]"
            
        # Add watermark if provided
        if watermark_path and os.path.exists(watermark_path):
            escaped_wm = watermark_path.replace("\\", "/").replace(":", "\\:")
            pos_expr = "W-w-30:30" if watermark_pos == "top_right" else (
                "30:30" if watermark_pos == "top_left" else (
                    "30:H-h-30" if watermark_pos == "bottom_left" else "W-w-30:H-h-30"
                )
            )
            filter_str += f";movie='{escaped_wm}',scale=140:-1 [wm];{current_v}[wm] overlay={pos_expr} [final_v]"
            current_v = "[final_v]"
        else:
            filter_str += f";{current_v} null [final_v]"
            
        # Video encoder selection
        vcodec = "libx264" if codec == "h264" else "libx265"
        
        cmd = [
            self.ffmpeg_bin, "-y",
            "-ss", str(start_time),
            "-to", str(end_time),
            "-i", input_path,
            "-filter_complex", filter_str,
            "-map", "[final_v]",
            "-map", "0:a?",
            "-c:v", vcodec,
            "-preset", "fast",
            "-crf", "22",
            "-r", str(fps),
            "-c:a", "aac",
            "-b:a", "192k",
            "-af", "loudnorm=I=-14:LRA=11:TP=-1.5",
            "-movflags", "+faststart",
            output_path
        ]
        
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            # Fallback without loudnorm if audio stream is missing or fails
            simple_cmd = [
                self.ffmpeg_bin, "-y",
                "-ss", str(start_time),
                "-to", str(end_time),
                "-i", input_path,
                "-filter_complex", filter_str,
                "-map", "[final_v]",
                "-c:v", vcodec,
                "-preset", "fast",
                "-crf", "22",
                "-r", str(fps),
                "-movflags", "+faststart",
                output_path
            ]
            res2 = subprocess.run(simple_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res2.returncode != 0:
                raise RuntimeError(f"FFmpeg render failed: {res.stderr}\nFallback error: {res2.stderr}")
                
        return output_path

ffmpeg_service = FFmpegService()
