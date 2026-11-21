import os
import re
from typing import List, Dict, Any, Optional

# Pre-defined keyword highlight lexicon
HIGH_IMPACT_KEYWORDS = {
    "viral", "secret", "never", "always", "huge", "insane", "crazy", "mistake",
    "money", "rich", "success", "million", "billion", "truth", "hack", "stop",
    "proven", "warning", "danger", "win", "lose", "power", "future", "ai",
    "growth", "business", "cash", "revenue", "strategy", "lesson", "free"
}

# Pre-defined keyword-to-emoji mapping
EMOJI_KEYWORDS = {
    "money": "💰", "cash": "💵", "rich": "🤑", "million": "💸", "billion": "💎",
    "viral": "🚀", "growth": "📈", "ai": "🤖", "future": "⚡", "secret": "🤫",
    "fire": "🔥", "crazy": "🤯", "insane": "😱", "warning": "⚠️", "danger": "🚨",
    "stop": "🛑", "win": "🏆", "success": "🎯", "mistake": "❌", "power": "💪",
    "love": "❤️", "time": "⏳", "question": "❓", "truth": "👁️", "idea": "💡"
}

CAPTION_TEMPLATES = {
    "karaoke_pop": {
        "name": "Karaoke Pop",
        "font_family": "Montserrat",
        "font_size": 48,
        "primary_color": "&H00FFFFFF",      # White
        "secondary_color": "&H0015CCFA",    # Bright Yellow highlight
        "outline_color": "&H00000000",      # Pure Black
        "shadow_color": "&H80000000",
        "outline": 4,
        "shadow": 2,
        "bold": 1,
        "alignment": 2,  # Bottom center
        "animation": "karaoke_jump"
    },
    "karaoke_bounce": {
        "name": "Karaoke Bounce",
        "font_family": "Montserrat ExtraBold",
        "font_size": 52,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0034D399",    # Vibrant Emerald Green
        "outline_color": "&H0009090B",
        "shadow_color": "&H90000000",
        "outline": 5,
        "shadow": 3,
        "bold": 1,
        "alignment": 2,
        "animation": "bounce"
    },
    "neon_glow": {
        "name": "Neon Cyber Glow",
        "font_family": "Arial Black",
        "font_size": 50,
        "primary_color": "&H00FFFF00",      # Cyan
        "secondary_color": "&H00FF00FF",    # Magenta
        "outline_color": "&H007F00FF",      # Purple glow
        "shadow_color": "&H0000FFFF",
        "outline": 6,
        "shadow": 0,
        "bold": 1,
        "alignment": 2,
        "animation": "glow"
    },
    "typewriter": {
        "name": "Typewriter Monospace",
        "font_family": "Courier New",
        "font_size": 42,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0038BDF8",    # Sky Blue
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "outline": 2,
        "shadow": 0,
        "bold": 1,
        "alignment": 2,
        "animation": "typewriter"
    },
    "bold_outline": {
        "name": "Heavy Black Outline",
        "font_family": "Impact",
        "font_size": 56,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000D0FF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "outline": 7,
        "shadow": 0,
        "bold": 1,
        "alignment": 2,
        "animation": "pop"
    },
    "boxed_highlight": {
        "name": "Boxed Red Highlight",
        "font_family": "Arial",
        "font_size": 46,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H000000FF",    # Pure Red Box
        "outline_color": "&H0018181B",
        "shadow_color": "&H00000000",
        "outline": 3,
        "shadow": 0,
        "bold": 1,
        "alignment": 2,
        "animation": "box"
    },
    "gradient_wave": {
        "name": "Gradient Sunset",
        "font_family": "Montserrat Black",
        "font_size": 48,
        "primary_color": "&H00F472B6",      # Pink
        "secondary_color": "&H00FBBF24",    # Amber
        "outline_color": "&H001E1B4B",
        "shadow_color": "&HA0000000",
        "outline": 4,
        "shadow": 3,
        "bold": 1,
        "alignment": 2,
        "animation": "wave"
    },
    "minimal_clean": {
        "name": "Minimal Clean",
        "font_family": "Helvetica",
        "font_size": 38,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H00E2E8F0",
        "outline_color": "&H000F172A",
        "shadow_color": "&H40000000",
        "outline": 2,
        "shadow": 1,
        "bold": 0,
        "alignment": 2,
        "animation": "fade"
    },
    "comic_boom": {
        "name": "Comic Boom",
        "font_family": "Comic Sans MS",
        "font_size": 52,
        "primary_color": "&H0000FFFF",      # Bright Yellow
        "secondary_color": "&H000080FF",    # Orange
        "outline_color": "&H00000000",
        "shadow_color": "&HFF000000",
        "outline": 6,
        "shadow": 4,
        "bold": 1,
        "alignment": 2,
        "animation": "shake"
    },
    "news_ticker": {
        "name": "News Ticker",
        "font_family": "Arial Bold",
        "font_size": 40,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H000000E6",    # Dark Red
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "outline": 2,
        "shadow": 0,
        "bold": 1,
        "alignment": 2,
        "animation": "ticker"
    },
    "fire_glow": {
        "name": "Fire Flame Glow",
        "font_family": "Impact",
        "font_size": 54,
        "primary_color": "&H0000A5FF",      # Orange flame
        "secondary_color": "&H0000FFFF",    # Yellow flame
        "outline_color": "&H000000FF",      # Deep red outline
        "shadow_color": "&H80000080",
        "outline": 5,
        "shadow": 2,
        "bold": 1,
        "alignment": 2,
        "animation": "fire"
    },
    "retro_vhs": {
        "name": "Retro 80s VHS",
        "font_family": "Courier New",
        "font_size": 44,
        "primary_color": "&H00FFFF00",      # Cyan
        "secondary_color": "&H00FF00FF",    # Pink
        "outline_color": "&H00000000",
        "shadow_color": "&H00FF0000",
        "outline": 3,
        "shadow": 4,
        "bold": 1,
        "alignment": 2,
        "animation": "vhs"
    },
    "editorial_serif": {
        "name": "Vogue Editorial Serif",
        "font_family": "Georgia",
        "font_size": 42,
        "primary_color": "&H00FAFAFA",
        "secondary_color": "&H00D4AF37",    # Metallic Gold
        "outline_color": "&H0018181B",
        "shadow_color": "&H60000000",
        "outline": 2,
        "shadow": 2,
        "bold": 1,
        "alignment": 2,
        "animation": "fade"
    },
    "tiktok_bold": {
        "name": "TikTok Viral Classic",
        "font_family": "Proxima Nova",
        "font_size": 50,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000E5FF",    # Bright Yellow Gold
        "outline_color": "&H00000000",
        "shadow_color": "&HA0000000",
        "outline": 5,
        "shadow": 3,
        "bold": 1,
        "alignment": 2,
        "animation": "karaoke_jump"
    },
    "beast_style": {
        "name": "Beast Punch Style",
        "font_family": "Komika Axis",
        "font_size": 58,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FF66",    # Electric Neon Green
        "outline_color": "&H00000000",
        "shadow_color": "&HFF000000",
        "outline": 7,
        "shadow": 5,
        "bold": 1,
        "alignment": 2,
        "animation": "bounce"
    },
    "luxury_gold": {
        "name": "Luxury Champagne Gold",
        "font_family": "Times New Roman",
        "font_size": 46,
        "primary_color": "&H00D4AF37",
        "secondary_color": "&H00FFFFFF",
        "outline_color": "&H000A0A0A",
        "shadow_color": "&H80000000",
        "outline": 3,
        "shadow": 2,
        "bold": 1,
        "alignment": 2,
        "animation": "fade"
    },
    "glitch_pulse": {
        "name": "Glitch Cyber Pulse",
        "font_family": "Consolas",
        "font_size": 46,
        "primary_color": "&H0000FF00",      # Lime Matrix
        "secondary_color": "&H00FFFFFF",
        "outline_color": "&H00003300",
        "shadow_color": "&H0000FF00",
        "outline": 4,
        "shadow": 1,
        "bold": 1,
        "alignment": 2,
        "animation": "glitch"
    },
    "spotlight": {
        "name": "Spotlight Dimmer",
        "font_family": "Montserrat SemiBold",
        "font_size": 44,
        "primary_color": "&H80FFFFFF",      # Dim semi-transparent white
        "secondary_color": "&H00FFFFFF",    # Bright focused white
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "outline": 3,
        "shadow": 0,
        "bold": 1,
        "alignment": 2,
        "animation": "spotlight"
    },
    "underline_sweep": {
        "name": "Underline Sweep",
        "font_family": "Arial",
        "font_size": 46,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H00FF3B30",    # Apple Red
        "outline_color": "&H001C1C1E",
        "shadow_color": "&H50000000",
        "outline": 3,
        "shadow": 2,
        "bold": 1,
        "alignment": 2,
        "animation": "underline"
    },
    "pastel_pop": {
        "name": "Pastel Lavender Pop",
        "font_family": "Comfortaa",
        "font_size": 48,
        "primary_color": "&H00E9D5FF",      # Lavender
        "secondary_color": "&H00A7F3D0",    # Mint
        "outline_color": "&H003B0764",
        "shadow_color": "&H60000000",
        "outline": 4,
        "shadow": 2,
        "bold": 1,
        "alignment": 2,
        "animation": "pop"
    },
    "high_contrast_yellow": {
        "name": "High Visibility Safety Yellow",
        "font_family": "Trebuchet MS",
        "font_size": 52,
        "primary_color": "&H0000F5FF",      # Intense Yellow
        "secondary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "outline": 6,
        "shadow": 0,
        "bold": 1,
        "alignment": 2,
        "animation": "jump"
    },
    "hollow_stencil": {
        "name": "Hollow Stencil Edge",
        "font_family": "Arial Black",
        "font_size": 50,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H000080FF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "outline": 5,
        "shadow": 0,
        "bold": 1,
        "alignment": 2,
        "animation": "stencil"
    },
    "rounded_badge": {
        "name": "Rounded Dark Badge",
        "font_family": "Montserrat Bold",
        "font_size": 44,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0038BDF8",
        "outline_color": "&H00020617",
        "shadow_color": "&HB0020617",
        "outline": 4,
        "shadow": 4,
        "bold": 1,
        "alignment": 2,
        "animation": "badge"
    },
    "dynamic_scale": {
        "name": "Dynamic Scale Punch",
        "font_family": "Montserrat ExtraBold",
        "font_size": 50,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H00F43F5E",    # Rose red
        "outline_color": "&H00000000",
        "shadow_color": "&H80000000",
        "outline": 5,
        "shadow": 2,
        "bold": 1,
        "alignment": 2,
        "animation": "scale_punch"
    },
    "emoji_pop": {
        "name": "Emoji Pop Reaction",
        "font_family": "Arial Bold",
        "font_size": 50,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000D0FF",
        "outline_color": "&H00000000",
        "shadow_color": "&H80000000",
        "outline": 5,
        "shadow": 2,
        "bold": 1,
        "alignment": 2,
        "animation": "emoji_reaction"
    }
}

class CaptionEngine:
    def __init__(self):
        self.templates = CAPTION_TEMPLATES

    def format_ass_time(self, seconds: float) -> str:
        """Converts floating seconds to ASS timestamp format: H:MM:SS.cs"""
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        cs = int((seconds - int(seconds)) * 100)
        return f"{hrs:d}:{mins:02d}:{secs:02d}.{cs:02d}"

    def clean_word(self, word: str) -> str:
        return re.sub(r"[^\w\s]", "", word).strip().lower()

    def generate_ass(
        self,
        words: List[Dict[str, Any]],
        output_path: str,
        template_key: str = "karaoke_pop",
        words_per_line: int = 3,
        auto_emoji: bool = True,
        keyword_highlight: bool = True,
        clip_start_offset: float = 0.0,
        position_y: int = 75
    ) -> str:
        """
        Compiles word-level timed tokens into an ASS subtitle file with
        exact karaoke highlights and template styling.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        template = self.templates.get(template_key, self.templates["karaoke_pop"])
        
        # Calculate vertical margin based on 1920 height
        margin_v = int(1920 * (100 - position_y) / 100)
        
        ass_header = f"""[Script Info]
Title: ClipForge Animated Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{template['font_family']},{template['font_size']},{template['primary_color']},{template['secondary_color']},{template['outline_color']},{template['shadow_color']},{template['bold']},0,0,0,100,100,1,0,1,{template['outline']},{template['shadow']},{template['alignment']},40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        # Group words into chunks of `words_per_line`
        chunks = []
        for i in range(0, len(words), words_per_line):
            chunks.append(words[i:i + words_per_line])
            
        dialogue_lines = []
        for chunk in chunks:
            if not chunk:
                continue
            line_start = max(0.0, chunk[0]["start"] - clip_start_offset)
            line_end = max(line_start + 0.1, chunk[-1]["end"] - clip_start_offset)
            
            ass_start = self.format_ass_time(line_start)
            ass_end = self.format_ass_time(line_end)
            
            line_text_parts = []
            emoji_prefix = ""
            
            for token in chunk:
                w_start = max(0.0, token["start"] - clip_start_offset)
                w_end = max(w_start + 0.05, token["end"] - clip_start_offset)
                duration_cs = max(5, int((w_end - w_start) * 100))
                
                raw_word = token.get("word", "").strip()
                cleaned = self.clean_word(raw_word)
                
                # Check emoji insertion
                if auto_emoji and cleaned in EMOJI_KEYWORDS and not emoji_prefix:
                    emoji_prefix = f"{EMOJI_KEYWORDS[cleaned]} "
                    
                # High-impact keyword highlighting override
                is_high_impact = keyword_highlight and cleaned in HIGH_IMPACT_KEYWORDS
                
                if is_high_impact:
                    # Emphasize in gold/hot pink
                    line_text_parts.append(r"{\c&H0020FF&}" + f"{{\\k{duration_cs}}}{raw_word}" + r"{\r}")
                else:
                    line_text_parts.append(f"{{\\k{duration_cs}}}{raw_word}")
                    
            full_line_text = f"{emoji_prefix}{' '.join(line_text_parts)}"
            dialogue_lines.append(
                f"Dialogue: 0,{ass_start},{ass_end},Default,,0,0,0,,{full_line_text}"
            )
            
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(ass_header + "\n".join(dialogue_lines) + "\n")
            
        return output_path

    def generate_srt(self, words: List[Dict[str, Any]], output_path: str, words_per_line: int = 4, clip_start_offset: float = 0.0) -> str:
        """Exports standard SubRip (.srt) subtitle track."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        chunks = [words[i:i + words_per_line] for i in range(0, len(words), words_per_line)]
        
        def to_srt_time(secs: float) -> str:
            hrs = int(secs // 3600)
            mins = int((secs % 3600) // 60)
            s = int(secs % 60)
            ms = int((secs - int(secs)) * 1000)
            return f"{hrs:02d}:{mins:02d}:{s:02d},{ms:03d}"
            
        lines = []
        for idx, chunk in enumerate(chunks, 1):
            if not chunk:
                continue
            start_s = max(0.0, chunk[0]["start"] - clip_start_offset)
            end_s = max(start_s + 0.1, chunk[-1]["end"] - clip_start_offset)
            text = " ".join(t.get("word", "") for t in chunk)
            lines.append(f"{idx}\n{to_srt_time(start_s)} --> {to_srt_time(end_s)}\n{text}\n")
            
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        return output_path

caption_engine = CaptionEngine()
