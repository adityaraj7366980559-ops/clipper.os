"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  UploadCloud,
  Link as LinkIcon,
  Video,
  Play,
  ArrowRight,
  TrendingUp,
  Scissors,
  Layers,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { fetchProjects, createProjectFromUrl } from "../lib/api";
import { Project } from "../types";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickUrl, setQuickUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = () => {
    fetchProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error("Error loading projects:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    setSubmitting(true);
    try {
      const proj = await createProjectFromUrl(quickUrl.trim(), "Imported ClipForge Project");
      router.push(`/projects/${proj.id}`);
    } catch (err: any) {
      alert(`Error creating project: ${err.message}`);
      setSubmitting(false);
    }
  };

  const handleLaunchSampleDemo = async () => {
    setSubmitting(true);
    try {
      const proj = await createProjectFromUrl(
        "https://www.youtube.com/watch?v=sample_podcast_demo",
        "Founder Secrets: Crafting Viral Shorts",
        {
          clip_length_preset: "30-60s",
          clip_count: 6,
          caption_template: "karaoke_pop",
          aspect_ratio: "9:16",
        }
      );
      router.push(`/projects/${proj.id}`);
    } catch (err: any) {
      alert(`Error starting demo: ${err.message}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-10 p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>OpusClip-Class AI Video Repurposing</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Turn 1 Long Video Into <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              10 Viral Vertical Clips in 1 Click
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
            AI active-speaker auto-reframe (9:16), 25+ animated karaoke caption presets, virality scoring rubric, one-click filler word removal, and direct YouTube Shorts scheduling.
          </p>

          {/* Quick Import Form */}
          <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="url"
                placeholder="Paste YouTube, Vimeo, Twitch, Zoom or MP4 link..."
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              <span>{submitting ? "Processing..." : "Get Clips Free"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={handleLaunchSampleDemo}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              <Zap className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
              <span>⚡ Load Sample 60s Video (Instant Demo)</span>
            </button>
            <Link
              href="/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-medium text-slate-300 hover:border-slate-700 transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5 text-sky-400" />
              <span>Upload Video File (MP4, MOV, MKV up to 10GB)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: Scissors,
            title: "AI Auto-Reframe",
            desc: "Active-speaker face tracking with silky camera smoothing. Fill, Fit blur, and Split layouts.",
            color: "text-sky-400",
            bg: "bg-sky-500/10",
          },
          {
            icon: Sparkles,
            title: "25+ Caption Presets",
            desc: "Animated karaoke word pop, high-contrast outlines, keyword colorizing, and automatic emojis.",
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
          },
          {
            icon: TrendingUp,
            title: "Virality Scoring Rubric",
            desc: "0-100 score on Hook strength, Flow coherence, Value density, and Trend shareability.",
            color: "text-pink-400",
            bg: "bg-pink-500/10",
          },
          {
            icon: Share2,
            title: "Direct Social Scheduling",
            desc: "One-click publishing to YouTube Shorts, TikTok, Instagram Reels, and LinkedIn with calendar.",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
        ].map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm hover:border-slate-700 transition-all"
            >
              <div className={`mb-3 inline-flex rounded-xl ${f.bg} p-2.5`}>
                <Icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-bold text-white text-base mb-1">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Projects List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Your Projects</h2>
            <p className="text-xs text-slate-400">Repurposed videos, clips gallery, and render jobs</p>
          </div>
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            <span>Create Project</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 py-16 text-center">
            <Video className="h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No video projects yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5">
              Paste a URL or upload a file above to generate your first batch of viral short clips.
            </p>
            <button
              onClick={handleLaunchSampleDemo}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Zap className="h-4 w-4 fill-white" />
              <span>Launch 60s Sample Demo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {projects.map((proj) => {
              const isCompleted = proj.status === "completed";
              const isProcessing = proj.status === "processing" || proj.status === "created";
              const isFailed = proj.status === "failed";
              const clipCount = proj.clips ? proj.clips.length : 0;

              return (
                <div
                  key={proj.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg hover:border-slate-700 hover:shadow-indigo-500/5 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Link
                          href={`/projects/${proj.id}`}
                          className="font-bold text-white text-base hover:text-sky-400 transition-colors line-clamp-1"
                        >
                          {proj.title}
                        </Link>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {new Date(proj.created_at).toLocaleDateString()} • {proj.resolution || "1080p"}
                        </span>
                      </div>

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Ready</span>
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-400 border border-sky-500/20 animate-pulse">
                          <Clock className="h-3 w-3" />
                          <span>{proj.progress}%</span>
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-400 border border-rose-500/20">
                          <AlertCircle className="h-3 w-3" />
                          <span>Failed</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {proj.stage_message || "Video processing..."}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Layers className="h-3.5 w-3.5 text-sky-400" />
                      <span>{clipCount} Viral Clips</span>
                    </div>

                    <Link
                      href={`/projects/${proj.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <span>View Clips</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
