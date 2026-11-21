# ClipForge Deployment Guide

ClipForge uses a decoupled, high-performance architecture:
- **Frontend (`Clipper/apps/web`)**: Hosted on **Vercel** (Next.js 14 App Router).
- **Backend API (`Clipper/apps/api`)**: Hosted on **Railway** or **Render** (FastAPI + Docker with FFmpeg & OpenCV).

---

## 1. Frontend Deployment (Vercel)

> **Important:** Do NOT deploy FastAPI on Vercel. Heavy media pipelines (FFmpeg, OpenCV, yt-dlp) exceed Vercel serverless function memory and timeout limits. Deploy Next.js to Vercel and FastAPI to Railway or Render.

### Steps:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... > Project**.
2. Select your repository: `adityaraj7366980559-ops/clipper.os`.
3. In the **Configure Project** screen:
   - **Root Directory**: Click *Edit* and select `Clipper/apps/web`.
   - **Framework Preset**: Next.js (auto-detected).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `.next` (default).
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend API URL (e.g. `https://clipforge-api.up.railway.app/api/v1`).
5. Click **Deploy**.

---

## 2. Backend Deployment (Railway or Render)

### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app/) and create a **New Project > Deploy from GitHub repo**.
2. Select `clipper.os`.
3. In **Settings**:
   - **Root Directory**: `Clipper/apps/api`
   - **Builder**: `Dockerfile` (uses `Clipper/apps/api/Dockerfile`)
4. In **Variables**, add the environment variables listed below.
5. In **Networking**, click **Generate Domain** to get your public API URL.
6. Copy that URL (e.g. `https://web-production-xxxx.up.railway.app`) and add `/api/v1` to Vercel's `NEXT_PUBLIC_API_URL`.

### Option B: Render
1. Go to [render.com](https://render.com/) and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Language**: `Docker`
   - **Root Directory**: `Clipper/apps/api`
   - **Dockerfile Path**: `./Dockerfile`
   - **Health Check Path**: `/health`
4. Add environment variables under **Environment**.
5. Click **Create Web Service**.

---

## 3. Environment Variables Reference

### Backend (`Clipper/apps/api`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `CORS_ORIGINS` | Yes (in prod) | Comma-separated list of allowed frontend origins (or `*`) | `https://your-clipforge.vercel.app` |
| `PORT` | Auto | Port to bind to (injected automatically by Railway/Render) | `8000` |
| `DATABASE_URL` | No | SQLite default; set for PostgreSQL | `sqlite+aiosqlite:///data/clipforge.db` |
| `STORAGE_TYPE` | No | Storage backend (`local` or `s3`) | `local` |
| `LLM_PROVIDER` | No | AI provider (`gemini`, `openai`, `ollama`, `mock`) | `gemini` |
| `GEMINI_API_KEY` | Optional | Google Gemini API Key | `AIza...` |
| `OPENAI_API_KEY` | Optional | OpenAI API Key | `sk-...` |
| `PEXELS_API_KEY` | Optional | Pexels API Key for AI B-Roll | `...` |
| `PIXABAY_API_KEY` | Optional | Pixabay API Key for AI B-Roll | `...` |

### Frontend (`Clipper/apps/web`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | Full URL pointing to your backend API with `/api/v1` | `https://clipforge-api.up.railway.app/api/v1` |

---

## 4. Verification & Health Check

Once your backend is deployed, you can verify it:
```bash
curl https://<YOUR_BACKEND_URL>/health
```
Expected response:
```json
{
  "status": "healthy",
  "app": "ClipForge",
  "version": "1.0.0",
  "database": "connected"
}
```
