"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
  Sliders,
  Check,
  ChevronDown,
  Info,
  Clock,
  MessageSquare,
  Hash,
  ShieldCheck,
  ArrowRight,
  Layers,
} from "lucide-react";
import { createProjectFromUrl, uploadVideoProject } from "../../lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"url" | "upload">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);

  // Advanced Options
  const [language, setLanguage] = useState("auto");
  const [clipLengthPreset, setClipLengthPreset] = useState("30-60s");
  const [clipCount, setClipCount] = useState(8);
  const [promptClipAnything, setPromptClipAnything] = useState("");
  const [keywordsInclude, setKeywordsInclude] = useState("");
  const [keywordsExclude, setKeywordsExclude] = useState("");
  const [captionTemplate, setCaptionTemplate] = useState("karaoke_pop");
  const [aspectRatio, setAspectRatio] = useState("9:16");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const settingsPayload = {
      language,
      clip_length_preset: clipLengthPreset,
      clip_count: clipCount,
      prompt_clip_anything: promptClipAnything,
      keywords_include: keywordsInclude ? keywordsInclude.split(",").map((s) => s.trim()) : [],
      keywords_exclude: keywordsExclude ? keywordsExclude.split(",").map((s) => s.trim()) : [],
      caption_template: captionTemplate,
      aspect_ratio: aspectRatio,
    };

    try {
      if (activeTab === "url") {
        if (!url.trim()) {
          alert("Please enter a valid video URL");
          setSubmitting(false);
          return;
        }
        const proj = await createProjectFromUrl(
          url.trim(),
          title.trim() || "Imported Project",
          settingsPayload
        );
        router.push(`/projects/${proj.id}`);
      } else {
        if (!file) {
          alert("Please select a video file to upload");
          setSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title.trim() || file.name);
        formData.append("language", language);
        formData.append("clip_length_preset", clipLengthPreset);
        formData.append("clip_count", clipCount.toString());
        formData.append("prompt_clip_anything", promptClipAnything);
        formData.append("caption_template", captionTemplate);
        formData.append("aspect_ratio", aspectRatio);

        const proj = await uploadVideoProject(formData);
        router.push(`/projects/${proj.id}`);
      }
    } catch (err: any) {
      alert(`Error creating project: ${err.message}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Create AI Video Project</h1>
        <p className="text-sm text-slate-400 mt-1">
          Import your long-form video to auto-extract viral vertical shorts with animated captions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Source Selector Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 shadow-xl">
          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800/80 max-w-sm">
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                activeTab === "url"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Paste URL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                activeTab === "upload"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload File</span>
            </button>
          </div>

          {activeTab === "url" ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Video URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... (or Vimeo, Twitch, Zoom, direct MP4)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Notice: Ensure you own the video or have permission to repurpose this content.</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Video File Upload</label>
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 p-8 text-center hover:border-sky-500 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="video/*,audio/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      if (!title) setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="h-10 w-10 text-sky-400 mb-2" />
                <p className="text-sm font-bold text-white mb-1">
                  {file ? file.name : "Drag & drop your video file here"}
                </p>
                <p className="text-xs text-slate-400">
                  Supports MP4, MOV, MKV, WebM, MP3, WAV up to 10 GB
                </p>
              </div>
            </div>
          )}

          {/* Project Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Project Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Founder Secrets: How to Scale Revenue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Advanced Options & OpusClip Settings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-sky-400" />
              <h2 className="text-base font-bold text-white">AI Clipping Preferences</h2>
            </div>
            <span className="text-xs text-slate-400">OpusClip-grade AI Engine</span>
          </div>

          {/* Prompt-Based Clipping: "ClipAnything" */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                <span>Prompt-Based Clipping ("ClipAnything")</span>
              </label>
              <span className="text-[11px] text-slate-400">Free-text semantic search</span>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Find moments where the guest talks about pricing mistakes, or all funny moments, or biggest regrets..."
              value={promptClipAnything}
              onChange={(e) => setPromptClipAnything(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Clip Length Preset */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Target Clip Length</label>
              <select
                value={clipLengthPreset}
                onChange={(e) => setClipLengthPreset(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-sky-500 outline-none"
              >
                <option value="<30s">&lt; 30s (Ultra-short / High Pace)</option>
                <option value="30-60s">30-60s (Recommended for TikTok & Shorts)</option>
                <option value="60-90s">60-90s (In-depth Story / Reels)</option>
                <option value="90s-3min">90s - 3min (Longer breakdown / LinkedIn)</option>
              </select>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Spoken Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-sky-500 outline-none"
              >
                <option value="auto">Auto-Detect Language (50+ Languages)</option>
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी / Devanagari)</option>
                <option value="hinglish">Hinglish (Roman Hindi / Hinglish toggle)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>

            {/* Target Clip Count Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Number of Clips</span>
                <span className="text-sky-400 font-bold">{clipCount} Clips</span>
              </div>
              <input
                type="range"
                min={3}
                max={15}
                value={clipCount}
                onChange={(e) => setClipCount(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-sky-500 outline-none"
              >
                <option value="9:16">9:16 (Vertical Shorts, TikTok, Reels)</option>
                <option value="1:1">1:1 (Square Feed Post)</option>
                <option value="4:5">4:5 (Instagram / Facebook Portrait)</option>
                <option value="16:9">16:9 (Landscape Standard)</option>
              </select>
            </div>

            {/* Caption Template Preview Selection */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Default Animated Caption Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: "karaoke_pop", name: "Karaoke Pop", tag: "Viral TikTok", color: "from-yellow-400 to-amber-500" },
                  { id: "karaoke_bounce", name: "Karaoke Bounce", tag: "Emerald Punch", color: "from-emerald-400 to-teal-500" },
                  { id: "neon_glow", name: "Neon Cyber", tag: "Glow & Pulse", color: "from-cyan-400 to-blue-500" },
                  { id: "beast_style", name: "Beast Style", tag: "High Energy", color: "from-green-400 to-emerald-600" },
                  { id: "bold_outline", name: "Heavy Outline", tag: "Classic Impact", color: "from-slate-200 to-slate-400" },
                  { id: "boxed_highlight", name: "Boxed Red", tag: "High Contrast", color: "from-rose-500 to-red-600" },
                  { id: "gradient_wave", name: "Sunset Wave", tag: "Pink & Amber", color: "from-pink-400 to-orange-400" },
                  { id: "editorial_serif", name: "Vogue Serif", tag: "Luxury Gold", color: "from-amber-200 to-yellow-600" },
                ].map((t) => {
                  const selected = captionTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCaptionTemplate(t.id)}
                      className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-sky-500 bg-sky-500/10 shadow-md shadow-sky-500/10"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[11px] font-bold text-white">{t.name}</span>
                        {selected && <Check className="h-3.5 w-3.5 text-sky-400" />}
                      </div>
                      <span className="text-[9px] text-slate-400">{t.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keyword Inclusion & Exclusion */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Keywords to Prioritize</label>
              <input
                type="text"
                placeholder="e.g. pricing, mistake, secret, growth"
                value={keywordsInclude}
                onChange={(e) => setKeywordsInclude(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Keywords to Exclude</label>
              <input
                type="text"
                placeholder="e.g. sponsor, intro, outro, ads"
                value={keywordsExclude}
                onChange={(e) => setKeywordsExclude(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-8 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>{submitting ? "Analyzing & Generating Clips..." : "Generate AI Clips Now"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
