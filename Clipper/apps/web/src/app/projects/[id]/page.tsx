"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Pause,
  Download,
  Share2,
  Sliders,
  Edit3,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  Twitter,
  Mail,
  Zap,
  Filter,
  Check,
} from "lucide-react";
import { fetchProject, getSubtitleDownloadUrl, schedulePosts, getWebSocketProgressUrl, getMediaUrl } from "../../../lib/api";
import { Project, Clip } from "../../../types";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"gallery" | "repurpose">("gallery");
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "duration" | "chronological">("score");

  // WebSocket for live progress
  useEffect(() => {
    let ws: WebSocket | null = null;
    const connectWs = () => {
      try {
        ws = new WebSocket(getWebSocketProgressUrl());
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.project_id === projectId) {
              setProject((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  progress: data.progress,
                  stage_message: data.message,
                  status: data.stage === "completed" ? "completed" : prev.status,
                };
              });
              if (data.stage === "completed") {
                // Reload project data to fetch generated clips
                loadData();
              }
            }
          } catch (e) {}
        };
      } catch (e) {}
    };

    connectWs();
    return () => {
      if (ws) ws.close();
    };
  }, [projectId]);

  const loadData = () => {
    fetchProject(projectId)
      .then((data) => setProject(data))
      .catch((err) => console.error("Error fetching project:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (project && project.status !== "completed" && project.status !== "failed") {
        loadData();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [projectId, project?.status]);

  if (loading && !project) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <span className="text-xs text-slate-400 font-medium">Loading project details...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Project Not Found</h2>
        <Link href="/" className="text-xs text-sky-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isCompleted = project.status === "completed";
  const clips = project.clips ? [...project.clips] : [];

  // Sort clips
  if (sortBy === "score") {
    clips.sort((a, b) => b.virality_score - a.virality_score);
  } else if (sortBy === "duration") {
    clips.sort((a, b) => b.duration - a.duration);
  } else {
    clips.sort((a, b) => a.start_time - b.start_time);
  }

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Projects</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {project.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Duration: {Math.round(project.duration)}s</span>
            <span>•</span>
            <span>Resolution: {project.resolution}</span>
            <span>•</span>
            <span>{clips.length} Scored Clips</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        {isCompleted && (
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "gallery"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Clips Gallery ({clips.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("repurpose")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "repurpose"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Long-Form Repurposing</span>
            </button>
          </div>
        )}
      </div>

      {/* Failed State Banner */}
      {project.status === "failed" && (
        <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-b from-rose-950/40 to-slate-950 p-8 text-center space-y-6 shadow-2xl">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Zap className="h-8 w-8" />
            </div>
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <h2 className="text-xl font-extrabold text-white">Pipeline Stage Failed</h2>
            <p className="text-sm font-semibold text-rose-300">{project.stage_message}</p>
            {project.error_message && (
              <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-500/30 text-left text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {project.error_message}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/settings"
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
            >
              Configure Anti-Bot / Cookies in Settings
            </Link>
            <button
              onClick={() => {
                fetchProject(project.id)
                  .then(data => setProject(data));
              }}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
            >
              Check Status
            </button>
          </div>
        </div>
      )}

      {/* Processing State Banner */}
      {!isCompleted && project.status !== "failed" && (
        <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 to-slate-950 p-8 text-center space-y-6 shadow-2xl">
          <div className="flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30">
              <Sparkles className="h-10 w-10 text-sky-400 animate-pulse" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-extrabold text-white">
              AI Is Forging Your Viral Clips
            </h2>
            <p className="text-xs text-slate-400">{project.stage_message}</p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Pipeline Execution ({project.status})</span>
              <span className="text-sky-400">{project.progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-w-3xl mx-auto pt-4 text-[11px] text-slate-400">
            <div className={`p-2.5 rounded-xl border ${project.progress >= 15 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold" : "border-slate-800"}`}>
              1. Download
            </div>
            <div className={`p-2.5 rounded-xl border ${project.progress >= 35 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold" : "border-slate-800"}`}>
              2. Transcribe
            </div>
            <div className={`p-2.5 rounded-xl border ${project.progress >= 55 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold" : "border-slate-800"}`}>
              3. Scene Cuts
            </div>
            <div className={`p-2.5 rounded-xl border ${project.progress >= 70 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold" : "border-slate-800"}`}>
              4. Virality Scoring
            </div>
            <div className={`p-2.5 rounded-xl border ${project.progress >= 85 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold" : "border-slate-800"}`}>
              5. 9:16 Render
            </div>
          </div>
        </div>
      )}

      {/* Completed State: Clips Gallery */}
      {isCompleted && activeTab === "gallery" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
              >
                <option value="score">Highest Virality Score (0-100)</option>
                <option value="duration">Longest Duration</option>
                <option value="chronological">Timeline Order</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Found <strong className="text-white">{clips.length}</strong> high-retention moments
              </span>
            </div>
          </div>

          {/* 9:16 Vertical Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clips.map((clip) => {
              const isPlaying = playingClipId === clip.id;
              const videoSrc = clip.preview_url
                ? getMediaUrl(clip.preview_url)
                : getMediaUrl(`/static/proxies/${clip.project_id}_proxy.mp4`);

              const scoreColor =
                clip.virality_score >= 85
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500 text-amber-400 bg-amber-500/10";

              return (
                <div
                  key={clip.id}
                  className="group relative flex flex-col rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl hover:border-sky-500/50 hover:shadow-sky-500/10 transition-all"
                >
                  {/* Vertical 9:16 Video Player / Preview Header */}
                  <div className="relative aspect-[9/16] max-h-[460px] w-full bg-black overflow-hidden flex items-center justify-center">
                    <video
                      id={`video-${clip.id}`}
                      src={videoSrc}
                      loop
                      playsInline
                      muted={!isPlaying}
                      className="h-full w-full object-cover"
                      onPlay={() => setPlayingClipId(clip.id)}
                      onPause={() => {
                        if (playingClipId === clip.id) setPlayingClipId(null);
                      }}
                    />

                    {/* Play / Pause Overlay Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`video-${clip.id}`) as HTMLVideoElement;
                        if (el) {
                          if (el.paused) el.play();
                          else el.pause();
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-lg hover:scale-110 transition-transform">
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                      </div>
                    </button>

                    {/* Virality Score Badge (Floating Top Right) */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 rounded-full backdrop-blur-md px-3 py-1 text-xs font-black shadow-lg border border-slate-700/80 bg-slate-950/80">
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[11px] font-extrabold ${scoreColor}`}>
                        {clip.virality_score}
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">Viral Score</span>
                    </div>

                    {/* Duration Badge (Floating Bottom Left) */}
                    <div className="absolute bottom-3.5 left-3.5 rounded-lg bg-black/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-slate-200 border border-white/10">
                      {Math.round(clip.duration)}s
                    </div>
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="flex-1 p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-white text-base line-clamp-2 leading-snug">
                        {clip.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {clip.why_it_works}
                      </p>
                    </div>

                    {/* Sub-Score Breakdown Chips */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold pt-1">
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 flex justify-between items-center">
                        <span className="text-slate-400">Hook Strength</span>
                        <span className="text-sky-400">{clip.hook_score}/100</span>
                      </div>
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 flex justify-between items-center">
                        <span className="text-slate-400">Story Flow</span>
                        <span className="text-indigo-400">{clip.flow_score}/100</span>
                      </div>
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 flex justify-between items-center">
                        <span className="text-slate-400">Value Density</span>
                        <span className="text-emerald-400">{clip.value_score}/100</span>
                      </div>
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 flex justify-between items-center">
                        <span className="text-slate-400">Trend Factor</span>
                        <span className="text-pink-400">{clip.trend_score}/100</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <Link
                        href={`/editor/${clip.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-sky-500/20 hover:opacity-95 transition-all"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Clip</span>
                      </Link>

                      {/* Subtitle Downloads */}
                      <a
                        href={getSubtitleDownloadUrl(clip.id, "srt")}
                        download
                        title="Download Subtitles (.srt)"
                        className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </a>

                      {/* Quick Publish to YouTube */}
                      <button
                        onClick={async () => {
                          await schedulePosts({
                            clip_id: clip.id,
                            platforms: ["youtube"],
                          });
                          alert("Scheduled to YouTube Shorts!");
                        }}
                        title="Publish to YouTube Shorts"
                        className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <Share2 className="h-4 w-4 text-sky-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Repurposing Tab: Long-form chapters, tweet thread, newsletter */}
      {isCompleted && activeTab === "repurpose" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chapters Box */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" />
                <span>Auto Video Chapters</span>
              </h3>
              <div className="space-y-2.5">
                {[
                  { time: "00:00", title: "Introduction & Hook Retention Framework" },
                  { time: "00:18", title: "The #1 Creator Mistake: Dropping First 3 Seconds" },
                  { time: "00:42", title: "Counter-Intuitive Truths for Maximum Watch Time" },
                ].map((ch, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <span className="font-semibold text-white">{ch.title}</span>
                    <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {ch.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Draft */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-400" />
                <span>Generated Newsletter Draft</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {`Subject: The Hidden Secret to Viral Shorts (${project.title})

Hey creators,

In this episode breakdown, we dive deep into retention engineering. The difference between 1,000 views and 1,000,000 views isn't camera gear—it's your hook.

Key takeaways:
1. Never start with greetings.
2. Hook within the first 3 seconds with a high-stakes controversy.
3. Use animated captions with highlighted trigger words.`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
