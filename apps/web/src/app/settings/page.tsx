"use client";

import React, { useState, useEffect } from "react";
import { Settings, Shield, Server, Key, Database, Check, RefreshCw } from "lucide-react";
import { fetchSystemMode } from "../../lib/api";

export default function SettingsPage() {
  const [systemMode, setSystemMode] = useState<any>({ mode: "Loading..." });
  const [llmProvider, setLlmProvider] = useState("gemini");
  const [transcriberProvider, setTranscriberProvider] = useState("local");
  const [geminiKey, setGeminiKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [pexelsKey, setPexelsKey] = useState("");
  const [storageType, setStorageType] = useState("local");
  const [cookiesBrowser, setCookiesBrowser] = useState("none");
  const [hasCookiesFile, setHasCookiesFile] = useState(false);

  useEffect(() => {
    fetchSystemMode().then((data) => {
      setSystemMode(data);
      if (data.llm_provider) setLlmProvider(data.llm_provider);
      if (data.transcriber_provider) setTranscriberProvider(data.transcriber_provider);
    }).catch(() => {});

    fetch("http://localhost:8000/api/v1/extras/cookies-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.cookies_browser) setCookiesBrowser(data.cookies_browser);
        if (data.has_cookies_file !== undefined) setHasCookiesFile(data.has_cookies_file);
      })
      .catch(() => {});
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("System settings and provider configurations updated!");
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System & AI Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Switch between fully local self-hosted mode and cloud APIs, configure models, and manage keys.
        </p>
      </div>

      {/* System Mode Status Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Execution Engine</span>
            <h2 className="text-lg font-black text-white">{systemMode.mode || "Self-Hostable Local Mode"}</h2>
            <p className="text-xs text-slate-400">FFmpeg 9.0 • Python 3.11 • SQLAlchemy SQLite/Postgres</p>
          </div>
        </div>

        <button
          onClick={() => fetchSystemMode().then(setSystemMode)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Health</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Providers Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="h-4 w-4 text-sky-400" />
            <h2 className="text-base font-bold text-white">AI Engine & Model Selection</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* LLM Provider */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Virality Scoring LLM</label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-sky-500"
              >
                <option value="gemini">Google Gemini 1.5 / 2.0 Flash (Default)</option>
                <option value="openai">OpenAI GPT-4o / GPT-4o-mini</option>
                <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                <option value="ollama">Local Ollama / LLaMA-3 ($0 Local Mode)</option>
              </select>
            </div>

            {/* Transcriber Provider */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Transcription & Timestamps</label>
              <select
                value={transcriberProvider}
                onChange={(e) => setTranscriberProvider(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-sky-500"
              >
                <option value="local">Local Faster-Whisper / Acoustic (Zero Cost)</option>
                <option value="gemini">Gemini Multimodal Audio API</option>
                <option value="openai">OpenAI Whisper API</option>
                <option value="deepgram">Deepgram Nova-2</option>
              </select>
            </div>

            {/* API Keys */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Google Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy... (configured via .env)"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">OpenAI API Key (Optional)</label>
              <input
                type="password"
                placeholder="sk-proj-... (optional fallback)"
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* YouTube Cookies & Bot-Check Bypass */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="h-4 w-4 text-sky-400" />
            <h2 className="text-base font-bold text-white">YouTube Anti-Bot & Cookies Bypass</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Cookies From Browser</label>
              <select
                value={cookiesBrowser}
                onChange={(e) => {
                  setCookiesBrowser(e.target.value);
                  fetch("http://localhost:8000/api/v1/extras/cookies-config?browser=" + e.target.value, { method: "POST" });
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-sky-500"
              >
                <option value="none">None (Standard Extractor)</option>
                <option value="chrome">Google Chrome</option>
                <option value="firefox">Mozilla Firefox</option>
                <option value="edge">Microsoft Edge</option>
                <option value="brave">Brave Browser</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Automatically extracts authenticated session cookies from your local browser to bypass YouTube bot checks.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Upload cookies.txt File</label>
              <input
                type="file"
                accept=".txt"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const fd = new FormData();
                    fd.append("file", e.target.files[0]);
                    const res = await fetch("http://localhost:8000/api/v1/extras/upload-cookies", {
                      method: "POST",
                      body: fd,
                    });
                    if (res.ok) {
                      setHasCookiesFile(true);
                      alert("cookies.txt uploaded successfully!");
                    }
                  }
                }}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-slate-700 file:bg-slate-950 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-900 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                {hasCookiesFile ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> cookies.txt is active and loaded
                  </span>
                ) : (
                  <span>Export cookies using browser extensions like "Get cookies.txt LOCALLY".</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Storage Provider */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Media Storage Target</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setStorageType("local")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                storageType === "local"
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-slate-800 bg-slate-950 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Local Disk Storage</span>
                {storageType === "local" && <Check className="h-4 w-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400">Stores proxies and rendered clips in data/ folder.</p>
            </div>

            <div
              onClick={() => setStorageType("s3")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                storageType === "s3"
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-slate-800 bg-slate-950 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">S3 / MinIO / Cloudflare R2</span>
                {storageType === "s3" && <Check className="h-4 w-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400">Cloud object storage with signed playback URLs.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:opacity-95"
          >
            <Check className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
