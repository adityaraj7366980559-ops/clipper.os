"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Share2,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { fetchScheduledPosts } from "../../lib/api";
import { SocialPost } from "../../types";

export default function CalendarPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Publishing & Scheduling Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated multi-platform distribution across YouTube Shorts, TikTok, Instagram Reels, and LinkedIn.
          </p>
        </div>

        {/* Auto-Publish Rule Tag */}
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
          <Sparkles className="h-4 w-4" />
          <span>Auto-Rule Active: Clips &gt; 85 Score auto-scheduled at 6:00 PM</span>
        </div>
      </div>

      {/* Week Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysOfWeek.map((day, idx) => (
          <div
            key={day}
            className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4 min-h-[300px]"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-extrabold text-white">{day}</span>
              <span className="text-[10px] text-slate-500 font-mono">Nov {20 + idx}</span>
            </div>

            <div className="space-y-2.5 flex-1">
              {idx === 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-400">YouTube Shorts</span>
                    <span className="text-[9px] text-slate-400 font-mono">18:00</span>
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-2">
                    The #1 Mistake Killing Your Reach 🚨
                  </p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Auto-Scheduled</span>
                  </span>
                </div>
              )}

              {idx === 2 && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-400">TikTok & Reels</span>
                    <span className="text-[9px] text-slate-400 font-mono">12:30</span>
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-2">
                    Why 99% Of Creators Fail At First 3 Seconds 😱
                  </p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-sky-400">
                    <Clock className="h-3 w-3" />
                    <span>Scheduled</span>
                  </span>
                </div>
              )}

              {posts.map((p, pIdx) => (
                <div
                  key={pIdx}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{p.platform}</span>
                    <span className="text-[9px] text-slate-500">{p.status}</span>
                  </div>
                  <p className="text-xs font-semibold text-white line-clamp-1">{p.title}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
