import os
import shutil
import subprocess
import traceback
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from app.core.config import settings

class DownloadError(Exception):
    """Human-readable exception raised when video download fails."""
    def __init__(self, message: str, stage: str = "Downloading", details: Optional[str] = None):
        super().__init__(message)
        self.stage = stage
        self.details = details or ""

class YoutubeDownloaderService:
    def __init__(self):
        self.node_path = self._find_node_or_deno()

    def _find_node_or_deno(self) -> Optional[str]:
        """Detects Node.js or Deno executable on system for yt-dlp JS challenge execution."""
        if settings.NODE_PATH and os.path.exists(settings.NODE_PATH):
            return settings.NODE_PATH

        # Check standard PATH
        node_bin = shutil.which("node") or shutil.which("deno")
        if node_bin:
            return node_bin

        # Common Windows installation locations
        common_paths = [
            r"C:\Program Files\nodejs\node.exe",
            r"C:\Program Files (x86)\nodejs\node.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\node\node.exe"),
            os.path.expandvars(r"%USERPROFILE%\.deno\bin\deno.exe")
        ]
        for p in common_paths:
            if os.path.exists(p):
                return p
        return None

    def _log_error(self, message: str, stderr: str = "", tb: str = ""):
        """Appends full traceback and logs to pipeline_errors.log."""
        try:
            settings.ERROR_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(settings.ERROR_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(f"\n{'='*70}\n[DOWNLOAD ERROR] {message}\n")
                if stderr:
                    f.write(f"--- STDERR ---\n{stderr}\n")
                if tb:
                    f.write(f"--- TRACEBACK ---\n{tb}\n")
                f.write(f"{'='*70}\n")
        except Exception:
            pass

    def get_info(self, url: str) -> Dict[str, Any]:
        """Extracts metadata without downloading full video."""
        cmd = [
            sys.executable, "-m", "yt_dlp",
            "--dump-json",
            "--no-playlist",
            "--no-check-certificates"
        ]
        if self.node_path:
            cmd.extend(["--js-runtimes", f"node:{self.node_path}"])
        cmd.extend(["--extractor-args", "youtube:player_client=android,ios,mweb"])
        cmd.append(url)

        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            import json
            # Try parsing or return basic fallback info
            return {"title": "Imported Video", "duration": 0}
        try:
            import json
            data = json.loads(res.stdout)
            return {
                "title": data.get("title", "Imported Video"),
                "duration": float(data.get("duration", 0)),
                "thumbnail": data.get("thumbnail"),
                "uploader": data.get("uploader", "YouTube Creator")
            }
        except Exception:
            return {"title": "Imported Video", "duration": 0}

    def download(self, url: str, output_path: str, progress_callback: Optional[callable] = None) -> str:
        """
        Downloads video with format selection, Node.js JS runtime, and client fallback retries.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Build fallback strategies in order
        strategies = [
            # 1. Android + iOS + mweb clients with 1080p limit and MP4 container
            {
                "name": "Mobile clients (Android, iOS, mweb)",
                "player_clients": "android,ios,mweb",
                "format": "bv*[height<=1080]+ba/b[height<=1080]/best[ext=mp4]/best",
            },
            # 2. iOS fallback
            {
                "name": "iOS client fallback",
                "player_clients": "ios",
                "format": "bestvideo*+bestaudio/best",
            },
            # 3. Android fallback
            {
                "name": "Android client fallback",
                "player_clients": "android",
                "format": "18/best[ext=mp4]/best",
            },
            # 4. Standard web client with generic format
            {
                "name": "Standard web client",
                "player_clients": "web,tv",
                "format": "best",
            }
        ]

        last_error = ""
        last_stderr = ""

        for attempt, strat in enumerate(strategies, 1):
            if progress_callback:
                progress_callback(f"Downloading video ({strat['name']})...", min(25, 5 + attempt * 5))

            cmd = [
                sys.executable, "-m", "yt_dlp",
                "--no-playlist",
                "--no-check-certificates",
                "--merge-output-format", "mp4",
                "-f", strat["format"],
                "-o", output_path
            ]

            # Configure JavaScript runtime (Node.js)
            if self.node_path:
                cmd.extend(["--js-runtimes", f"node:{self.node_path}"])

            # Configure YouTube player clients
            if strat.get("player_clients"):
                cmd.extend(["--extractor-args", f"youtube:player_client={strat['player_clients']}"])

            # Add cookies if cookies.txt exists in data directory
            if settings.COOKIES_FILE_PATH.exists() and settings.COOKIES_FILE_PATH.stat().st_size > 0:
                cmd.extend(["--cookies", str(settings.COOKIES_FILE_PATH)])
            elif settings.YOUTUBE_COOKIES_BROWSER and settings.YOUTUBE_COOKIES_BROWSER.lower() != "none":
                cmd.extend(["--cookies-from-browser", settings.YOUTUBE_COOKIES_BROWSER.lower()])

            cmd.append(url)

            try:
                res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=180)
                if res.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                    return output_path
                last_stderr = res.stderr or res.stdout
                last_error = f"Attempt {attempt} ({strat['name']}) exited with code {res.returncode}: {last_stderr[-500:] if last_stderr else 'No output'}"
            except subprocess.TimeoutExpired:
                last_error = f"Attempt {attempt} ({strat['name']}) timed out after 180 seconds."
            except Exception as e:
                last_error = f"Attempt {attempt} ({strat['name']}) failed: {str(e)}"
                last_stderr = traceback.format_exc()

        # If all strategies failed, log to file and formulate a human-friendly error
        self._log_error(f"All download attempts failed for URL: {url}", stderr=last_stderr, tb=last_error)

        human_msg = self._humanize_error(last_stderr)
        raise DownloadError(human_msg, stage="Downloading", details=last_stderr)

    def _humanize_error(self, stderr: str) -> str:
        """Translates raw yt-dlp stderr into actionable guidance for the user."""
        s = stderr.lower()
        if "sign in to confirm you’re not a bot" in s or "login_required" in s:
            return (
                "YouTube flagged this request with a bot check. "
                "Fix: In Settings, select 'Cookies from Browser' (e.g. Chrome/Edge) or upload a cookies.txt file."
            )
        elif "video unavailable" in s or "private video" in s:
            return "This video is private, unavailable, or restricted by the author."
        elif "members-only" in s:
            return "This video requires a paid YouTube channel membership."
        elif "getaddrinfo failed" in s or "certificate verify failed" in s:
            return "Network connection issue reaching YouTube. Check your internet connectivity or proxy settings."
        elif "http error 429" in s:
            return "YouTube rate-limited this IP (HTTP 429 Too Many Requests). Please wait a moment or configure browser cookies in Settings."
        else:
            return f"Failed to download video stream from YouTube: {stderr[-250:] if stderr else 'Unknown error'}"

youtube_downloader = YoutubeDownloaderService()
