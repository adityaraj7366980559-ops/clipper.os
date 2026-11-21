# ClipForge ⚡

> **Enterprise AI Video Clipping & Virality Repurposing Platform**  
> Turn long-form podcasts, interviews, webinars, streams, and lectures into viral, high-converting, vertical shorts (9:16) with animated karaoke captions, active-speaker auto-reframing, AI B-roll, filler word removal, and direct social publishing.

---

## 🚀 Key Features

### 1. OpusClip-Class Core Features
- **Smart Import & Video Normalization**:
  - Ingest via URL (YouTube, Vimeo, Twitch, Zoom recordings, Google Drive, direct MP4) via `yt-dlp` or upload video files (MP4, MOV, MKV, WebM up to 10GB).
  - Generates fast 720p H.264 proxies for ultra-smooth web scrubbing.
- **Word-Level Transcription & Diarization**:
  - Sub-second word-level timestamps (`[{"word": ..., "start": ..., "end": ...}]`) and speaker diarization.
  - Pluggable provider architecture: Google Gemini Flash Multimodal, OpenAI Whisper API, Deepgram Nova-2, or Local Faster-Whisper.
- **AI Virality Scoring Engine (0-100)**:
  - 4-part scoring rubric: **Hook Strength** (first 3 seconds), **Flow/Story Coherence**, **Value Density**, and **Trend Shareability**.
  - Provides a human-readable *"Why this will work"* rationale.
  - Auto-generates 1 primary viral hook title + 3 A/B test hook variants + platform hashtags for TikTok, Instagram Reels, YouTube Shorts, and LinkedIn.
- **"ClipAnything" Prompt-Based Clipping**:
  - Free-text semantic querying: *"Find moments where the guest talks about pricing mistakes"*, *"All funny reactions"*, *"Biggest career regrets"*.
- **Active-Speaker Auto Reframe (9:16, 1:1, 4:5)**:
  - Face detection and speaker tracking with exponential moving average damping to prevent virtual camera jitter.
  - Multiple layouts: **Fill** (auto-follow speaker), **Fit** (blurred background), **Split** (two speakers stacked), and **Three-up**.
- **25+ Animated Caption Templates**:
  - Word-by-word karaoke highlights, pop-in bounces, typewriter, neon cyber glow, bold impact outline, boxed highlights, and sunset waves.
  - Full customization: font size, primary color, highlight color, stroke, shadow, safe-zone guides, auto keyword colorizer, and auto emoji insertion.
  - Subtitle track exports: `.srt`, `.ass`, `.vtt`, `.txt`.
- **Browser-Based Clip Studio Editor**:
  - **Text-Based Video Editing**: click any word to seek; delete words to slice and cut the video.
  - One-click **Remove Filler Words** (*"um"*, *"uh"*, *"like"*, *"you know"*) and **Remove Silences** with jump-cut zoom punches.
  - **AI B-Roll**: live stock footage search via Pexels & Pixabay.
  - **Audio Enhancement**: royalty-free background music library with auto-ducking under speech to -14 LUFS.
- **Direct Social Publishing & Scheduling**:
  - YouTube Shorts Data API v3 integration with direct upload, title, description, and hashtags.
  - Stubs & webhooks for TikTok, Instagram Reels, LinkedIn, and X.
  - Visual calendar scheduler with automated publishing rules (*"Clips with score > 85 get posted to Shorts at 6 PM"*).

### 2. Extra Features (Beyond OpusClip)
- **100% Free Local Mode**: Runs without any paid APIs using local Faster-Whisper and local Ollama/LLaMA-3 models.
- **A/B Hook Variant Tester**: Generates 3 distinctive titles and caption styles for the same clip to test CTR.
- **Content Repurposing Engine**: Automatically generates YouTube video chapters with timestamps, a LinkedIn newsletter draft, and a viral Twitter/X thread.
- **Brand Kits**: Custom channel watermarks, primary/secondary colors, and default typography presets.
- **Quick Keyboard Shortcuts & Command Palette (`Cmd+K` / `Ctrl+K`)**.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Zustand, Framer Motion, Lucide Icons.
- **Backend API**: FastAPI (Python 3.11), SQLAlchemy Async (SQLite for zero-config local dev, PostgreSQL for production), WebSockets for real-time progress.
- **Media Engine**: FFmpeg 9.0 (`libass`, `loudnorm`, `boxblur`), OpenCV face tracking.
- **Containerization**: Docker Compose (`api`, `web`, `redis`, `postgres`).

---

## ⚡ Quick Start

### Option 1: One-Command Local Launch (Recommended)

#### Windows:
Double-click or run:
```cmd
start.bat
```

#### macOS / Linux:
```bash
chmod +x start.sh
./start.sh
```

- **Web Studio**: [http://localhost:3000](http://localhost:3000)
- **API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Docker Compose

```bash
docker-compose up --build
```

---

## 🧪 Testing & Verification

ClipForge includes a synthetic 60-second test video generator with simulated audio and visual speakers:

```bash
# Generate the 60s sample podcast video
python sample_generator.py sample_podcast.mp4

# Run the end-to-end pipeline test
cd apps/api
python tests/test_pipeline_e2e.py
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in any optional provider keys:

```ini
# AI Providers (Defaults to Local Mode if empty)
GEMINI_API_KEY=""
OPENAI_API_KEY=""

# Stock Footage & Media
PEXELS_API_KEY=""
PIXABAY_API_KEY=""

# Social Publishing
YOUTUBE_CLIENT_ID=""
YOUTUBE_CLIENT_SECRET=""
```

---

## 📄 License
MIT License. Built for high-volume content creators and media agencies.
