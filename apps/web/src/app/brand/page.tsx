"use client";

import React, { useEffect, useState } from "react";
import { Palette, Sparkles, Check, UploadCloud, Shield } from "lucide-react";
import { fetchBrandKits } from "../../lib/api";
import { BrandKit } from "../../types";

export default function BrandKitPage() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("Creator Studio Official");
  const [primaryColor, setPrimaryColor] = useState("#38bdf8");
  const [secondaryColor, setSecondaryColor] = useState("#f43f5e");
  const [fontFamily, setFontFamily] = useState("Montserrat Black");
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkPos, setWatermarkPos] = useState("top_right");

  useEffect(() => {
    fetchBrandKits()
      .then((data) => {
        setKits(data);
        if (data.length > 0) {
          setName(data[0].name);
          setPrimaryColor(data[0].primary_color);
          setSecondaryColor(data[0].secondary_color);
          setFontFamily(data[0].font_family);
          setWatermarkEnabled(data[0].watermark_enabled);
          setWatermarkPos(data[0].watermark_position || "top_right");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Brand Kit preferences updated successfully!");
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Brand Kit & Styling</h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize your channel logo watermark, brand colors, custom font, and intro/outro clips.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 shadow-xl">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Brand Kit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-sky-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Primary & Secondary Color */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-16 rounded-lg bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300">{primaryColor}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Accent / Highlight Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-16 rounded-lg bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300">{secondaryColor}</span>
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Default Font</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-sky-500"
              >
                <option value="Montserrat Black">Montserrat Black (Viral Standard)</option>
                <option value="Impact">Impact (Heavy High Contrast)</option>
                <option value="Proxima Nova">Proxima Nova (TikTok Classic)</option>
                <option value="Arial Black">Arial Black (Clean & Bold)</option>
                <option value="Georgia">Georgia (Luxury Editorial Serif)</option>
              </select>
            </div>
          </div>

          {/* Watermark Section */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Burn Logo Watermark</span>
                <span className="text-[11px] text-slate-400">Overlays your channel logo in exported clips</span>
              </div>
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="h-4 w-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {watermarkEnabled && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Watermark Position</label>
                <select
                  value={watermarkPos}
                  onChange={(e) => setWatermarkPos(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="top_right">Top Right</option>
                  <option value="top_left">Top Left</option>
                  <option value="bottom_right">Bottom Right</option>
                  <option value="bottom_left">Bottom Left</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:opacity-95"
          >
            <Check className="h-4 w-4" />
            <span>Save Brand Kit</span>
          </button>
        </div>
      </form>
    </div>
  );
}
