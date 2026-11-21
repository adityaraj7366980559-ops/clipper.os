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
  Scissors,
  Volume2,
  Music,
  Image as ImageIcon,
  Type,
  Layers,
  ArrowLeft,
  Check,
  RefreshCw,
  Clock,
  Eye,
  Zap,
  Trash2,
  Shield,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import {
  fetchClip,
  updateClip,
  renderClip,
  fetchTemplates,
  searchBroll,
  fetchMusicTracks,
  schedulePosts,
  getSubtitleDownloadUrl,
  getMediaUrl,
} from "../../../lib/api";
import { Clip, CaptionTemplate, WordToken } from "../../../types";

export default function ClipEditorPage() {
  const params = useParams();
  const router = useRouter();
  const clipId = params.id as string;

  const [clip, setClip] = useState<Clip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transcript" | "captions" | "broll" | "audio" | "reframe">("transcript");
  
  // Video player playback state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSafeZone, setShowSafeZone] = useState(true);

  // Templates & Stock Media
  const [templates, setTemplates] = useState<CaptionTemplate[]>([]);
  const [brollQuery, setBrollQuery] = useState("business growth");
  const [brollResults, setBrollResults] = useState<any[]>([]);
  const [musicTracks, setMusicTracks] = useState<any[]>([]);

  // Export Modal state
  const [rendering, setRendering] = useState(false);
  const [exportResolution, setExportResolution] = useState("1080p");
  const [exportFps, setExportFps] = useState(30);
  const [exportCodec, setExportCodec] = useState("h264");

  // Load Clip & Metadata
  useEffect(() => {
    fetchClip(clipId)
      .then((data) => {
        setClip(data);
        setCurrentTime(data.start_time);
      })
      .catch((err) => console.error("Error fetching clip:", err))
      .finally(() => setLoading(false));

    fetchTemplates().then(setTemplates).catch(() => {});
    fetchMusicTracks().then(setMusicTracks).catch(() => {});
    searchBroll("growth").then(setBrollResults).catch(() => {});
  }, [clipId]);

  // Video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Text-Based Editing: Delete word to splice video
  const handleDeleteWord = async (index: number) => {
    if (!clip || !clip.transcript_segments) return;
    const newWords = [...clip.transcript_segments];
    newWords.splice(index, 1);
    const updated = await updateClip(clip.id, { transcript_segments: newWords });
    setClip(updated);
  };

  // Remove Filler Words
  const handleRemoveFillers = async () => {
    if (!clip || !clip.transcript_segments) return;
    const fillers = new Set(["um", "uh", "like", "you know", "basically", "literally"]);
    const cleaned = clip.transcript_segments.filter(
      (w) => !fillers.has(w.word.toLowerCase().replace(/[^\w]/g, ""))
    );
    const updated = await updateClip(clip.id, {
      transcript_segments: cleaned,
      filler_words_removed: true,
    });
    setClip(updated);
  };

  // Remove Silences / Dead Air
  const handleRemoveSilences = async () => {
    if (!clip) return;
    const updated = await updateClip(clip.id, { silence_removed: true });
    setClip(updated);
    alert("Silences removed with smooth jump-cut zoom punches!");
  };

  // Caption Template Change
  const handleSelectTemplate = async (templateId: string) => {
    if (!clip) return;
    const updated = await updateClip(clip.id, { caption_template: templateId });
    setClip(updated);
  };

  // Layout Change (Fill, Fit blur, Split)
  const handleSelectLayout = async (layout: string) => {
    if (!clip) return;
    const updated = await updateClip(clip.id, { layout });
    setClip(updated);
  };

  // Trigger Final High-Res Render
  const handleStartRender = async () => {
    if (!clip) return;
    setRendering(true);
    try {
      const updated = await renderClip(clip.id, {
        resolution: exportResolution,
        fps: exportFps,
        codec: exportCodec,
        burn_captions: true,
      });
      setClip(updated);
      alert("Render job submitted! Check the video player in a few moments.");
    } catch (err: any) {
      alert(`Render error: ${err.message}`);
    } finally {
      setRendering(false);
    }
  };

  // Social Publishing
  const handlePublish = async (platform: string) => {
    if (!clip) return;
    try {
      await schedulePosts({
        clip_id: clip.id,
        platforms: [platform],
        custom_title: clip.title,
        custom_description: clip.description,
      });
      alert(`Successfully published to ${platform}!`);
    } catch (e: any) {
      alert(`Error publishing: ${e.message}`);
    }
  };

  if (loading || !clip) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  const videoSrc = clip.preview_url
    ? getMediaUrl(clip.preview_url)
    : getMediaUrl(`/static/proxies/${clip.project_id}_proxy.mp4`);

  // Find currently spoken word
  const activeWord = clip.transcript_segments?.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      {/* Top Studio Action Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${clip.project_id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Clips Gallery</span>
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <h1 className="text-sm font-extrabold text-white line-clamp-1 max-w-md">
            {clip.title}
          </h1>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            Viral Score: {clip.virality_score}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Subtitle Download */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-800 overflow-hidden text-xs">
            <a
              href={getSubtitleDownloadUrl(clip.id, "srt")}
              download
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              SRT
            </a>
            <div className="w-px bg-slate-700" />
            <a
              href={getSubtitleDownloadUrl(clip.id, "ass")}
              download
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              ASS
            </a>
          </div>

          {/* Export / Render Button */}
          <button
            onClick={handleStartRender}
            disabled={rendering}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-sky-500/20 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{rendering ? "Rendering..." : "Export 1080p MP4"}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Panel Studio Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Editing Tools & Tabs */}
        <div className="w-80 md:w-96 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
          {/* Tool Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950 p-1">
            {[
              { id: "transcript", label: "Transcript", icon: Scissors },
              { id: "captions", label: "Captions", icon: Type },
              { id: "broll", label: "AI B-Roll", icon: ImageIcon },
              { id: "audio", label: "Audio", icon: Volume2 },
              { id: "reframe", label: "Reframe", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 text-[11px] font-bold transition-all rounded-lg ${
                    active
                      ? "bg-slate-800 text-sky-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. TRANSCRIPT EDITING TAB */}
            {activeTab === "transcript" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Text-Based Video Cut</span>
                  <span className="text-[10px] text-slate-400">Click word to seek, delete to cut</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRemoveFillers}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 py-2 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20 transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                    <span>Cut Fillers (um, uh)</span>
                  </button>
                  <button
                    onClick={handleRemoveSilences}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all"
                  >
                    <Zap className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Remove Silences</span>
                  </button>
                </div>

                {/* Word Tokens Grid */}
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 max-h-[480px] overflow-y-auto">
                  {clip.transcript_segments?.map((token, idx) => {
                    const isWordActive = currentTime >= token.start && currentTime <= token.end;
                    return (
                      <span
                        key={idx}
                        className={`group relative inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs cursor-pointer transition-all ${
                          isWordActive
                            ? "bg-amber-400 text-black font-extrabold shadow-sm scale-105"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                        onClick={() => seekTo(token.start)}
                      >
                        <span>{token.word}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWord(idx);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity ml-0.5"
                          title="Delete word and cut video segment"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. CAPTION STYLING TAB */}
            {activeTab === "captions" && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-white">25+ Animated Caption Templates</span>
                <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {templates.map((tpl) => {
                    const selected = clip.caption_template === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                          selected
                            ? "border-sky-500 bg-sky-500/10 shadow-md shadow-sky-500/10"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-[11px] font-bold text-white line-clamp-1">{tpl.name}</span>
                          {selected && <Check className="h-3 w-3 text-sky-400" />}
                        </div>
                        <span className="text-[9px] text-slate-400 capitalize">{tpl.animation}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. AI B-ROLL TAB */}
            {activeTab === "broll" && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-white">AI B-Roll & Stock Footage</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brollQuery}
                    onChange={(e) => setBrollQuery(e.target.value)}
                    placeholder="Search stock footage..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => searchBroll(brollQuery).then(setBrollResults)}
                    className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-400"
                  >
                    Search
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[460px] overflow-y-auto">
                  {brollResults.map((b, i) => (
                    <div
                      key={i}
                      className="group relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden cursor-pointer hover:border-sky-500 transition-all"
                      onClick={() => alert(`Added B-Roll clip "${b.title}" to timeline!`)}
                    >
                      <img src={b.preview_url} alt={b.title} className="h-24 w-full object-cover" />
                      <div className="p-1.5">
                        <span className="text-[10px] font-semibold text-slate-300 line-clamp-1">{b.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. AUDIO & MUSIC TAB */}
            {activeTab === "audio" && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-white">Royalty-Free Background Music</span>
                <p className="text-[11px] text-slate-400">
                  Auto-ducking automatically reduces music volume under spoken dialogue to -14 LUFS.
                </p>

                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {musicTracks.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 cursor-pointer"
                      onClick={() => alert(`Selected background music: ${m.name}`)}
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-400">{m.genre} • {m.mood}</span>
                      </div>
                      <Music className="h-4 w-4 text-sky-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. REFRAME & LAYOUT TAB */}
            {activeTab === "reframe" && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-white">Camera Reframing & Layout</span>
                <div className="space-y-2">
                  {[
                    { id: "fill", name: "Fill (Auto-Follow Speaker)", desc: "Damped virtual camera tracks active speaker" },
                    { id: "fit", name: "Fit (Blurred Background)", desc: "16:9 original centered with blurred fill" },
                    { id: "split", name: "Split (Two Speakers Stacked)", desc: "Both interview participants visible" },
                  ].map((l) => {
                    const selected = clip.layout === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => handleSelectLayout(l.id)}
                        className={`w-full flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? "border-sky-500 bg-sky-500/10 shadow-sm"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold text-white">{l.name}</span>
                          {selected && <Check className="h-3.5 w-3.5 text-sky-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400">{l.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANEL: Vertical 9:16 Video Player with Safe Zones & Captions */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
          {/* Safe-Zone Toggle Pill */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={() => setShowSafeZone(!showSafeZone)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-all ${
                showSafeZone
                  ? "border-sky-500 bg-sky-500/10 text-sky-400"
                  : "border-slate-800 bg-slate-900 text-slate-400"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Safe Zone Overlay</span>
            </button>
          </div>

          {/* 9:16 Frame Player Container */}
          <div className="relative aspect-[9/16] h-[78vh] max-h-[680px] rounded-3xl bg-black border-2 border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoSrc}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="h-full w-full object-cover"
              onClick={togglePlay}
            />

            {/* Simulated Live Animated Caption Display */}
            {activeWord && (
              <div className="absolute bottom-20 left-4 right-4 flex items-center justify-center pointer-events-none z-10">
                <div className="bg-black/60 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-100">
                  <span className="text-xl md:text-2xl font-black text-amber-300 tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {activeWord.word}
                  </span>
                </div>
              </div>
            )}

            {/* TikTok / Reels / Shorts UI Safe Zone Overlay Guides */}
            {showSafeZone && (
              <div className="absolute inset-0 pointer-events-none safe-zone-overlay flex flex-col justify-between p-4">
                <div className="h-14 border-b border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-[10px] text-white/40 uppercase font-mono">Platform Top Safe Zone</span>
                </div>
                <div className="flex justify-between items-end pb-12">
                  <div className="text-[10px] text-white/40 font-mono">Profile / Caption Area</div>
                  <div className="text-[10px] text-white/40 font-mono">Likes / Share Buttons</div>
                </div>
              </div>
            )}

            {/* Big Play Button Overlay when paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/40 shadow-2xl hover:scale-110 transition-transform"
              >
                <Play className="h-7 w-7 fill-white ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Virality Inspector & Social Publishing */}
        <div className="w-80 md:w-88 border-l border-slate-800 bg-slate-900/50 flex flex-col overflow-y-auto p-5 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" />
              <span>A/B Hook Title Variants</span>
            </span>
            <p className="text-[11px] text-slate-400">OpusClip-generated titles for A/B split testing</p>
          </div>

          {/* Hook Titles Picker */}
          <div className="space-y-2">
            {[clip.title, ...(clip.hook_variants || [])].map((t, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-medium text-slate-200"
                onClick={() => updateClip(clip.id, { title: t }).then(setClip)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-sky-400">Variant {idx + 1}</span>
                  {clip.title === t && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <span>{t}</span>
              </div>
            ))}
          </div>

          {/* Social Hashtags */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white">Platform Hashtags</span>
            <div className="flex flex-wrap gap-1">
              {(clip.hashtags?.shorts || ["#shorts", "#viral", "#podcast"]).map((h, i) => (
                <span
                  key={i}
                  className="rounded-md bg-slate-950 px-2 py-1 text-[11px] font-mono text-sky-300 border border-slate-800"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Direct Social Publish Connectors */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-sky-400" />
              <span>1-Click Social Publishing</span>
            </span>

            <div className="space-y-2">
              <button
                onClick={() => handlePublish("youtube")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-red-600/10 border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-600/20 transition-all"
              >
                <span>Publish to YouTube Shorts</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>

              <button
                onClick={() => handlePublish("tiktok")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-900 transition-all"
              >
                <span>Schedule to TikTok</span>
                <Clock className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => handlePublish("instagram")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-xs font-bold text-pink-400 hover:bg-pink-500/20 transition-all"
              >
                <span>Schedule to Instagram Reels</span>
                <Clock className="h-4 w-4 text-pink-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
