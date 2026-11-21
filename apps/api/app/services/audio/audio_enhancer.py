import os
import re
from typing import List, Dict, Any, Tuple

FILLER_WORDS = {"um", "uh", "like", "you know", "er", "ah", "basically", "literally"}

BACKGROUND_MUSIC_TRACKS = [
    {
        "id": "bgm_lofi_chill",
        "name": "Lo-Fi Deep Focus",
        "genre": "Lo-Fi / Chill",
        "bpm": 85,
        "mood": "Calm & Focused",
        "url": "/static/music/lofi_chill.mp3"
    },
    {
        "id": "bgm_synthwave_energy",
        "name": "Cyber Synthwave Pulse",
        "genre": "Electronic",
        "bpm": 120,
        "mood": "High Energy & Futuristic",
        "url": "/static/music/synthwave.mp3"
    },
    {
        "id": "bgm_ambient_story",
        "name": "Ambient Narrative",
        "genre": "Cinematic",
        "bpm": 90,
        "mood": "Emotional & Dramatic",
        "url": "/static/music/ambient.mp3"
    },
    {
        "id": "bgm_upbeat_acoustic",
        "name": "Upbeat Acoustic Spark",
        "genre": "Acoustic Pop",
        "bpm": 115,
        "mood": "Friendly & Inspiring",
        "url": "/static/music/acoustic.mp3"
    }
]

class AudioEnhancerService:
    def identify_filler_words(self, words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifies words marked as fillers for one-click removal."""
        fillers = []
        for w in words:
            cleaned = re.sub(r"[^\w\s]", "", w.get("word", "")).strip().lower()
            if cleaned in FILLER_WORDS:
                fillers.append(w)
        return fillers

    def identify_silences(
        self, words: List[Dict[str, Any]], start_time: float, end_time: float, min_gap_seconds: float = 0.5
    ) -> List[Tuple[float, float]]:
        """Identifies pauses/dead-air gaps between words exceeding min_gap_seconds."""
        gaps = []
        if not words:
            return gaps
            
        cur = start_time
        for w in words:
            w_start = w["start"]
            if w_start - cur >= min_gap_seconds:
                gaps.append((round(cur, 2), round(w_start, 2)))
            cur = max(cur, w["end"])
            
        if end_time - cur >= min_gap_seconds:
            gaps.append((round(cur, 2), round(end_time, 2)))
            
        return gaps

    def get_music_tracks(self) -> List[Dict[str, Any]]:
        return BACKGROUND_MUSIC_TRACKS

audio_enhancer = AudioEnhancerService()
