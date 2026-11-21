"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Check, Play, Sliders } from "lucide-react";
import { fetchTemplates } from "../../lib/api";
import { CaptionTemplate } from "../../types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CaptionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("karaoke_pop");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-400 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>25+ High-Converting Styles</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Animated Caption Templates
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Word-by-word karaoke highlights, pop-in bounces, neon pulses, high-contrast outlines, and auto keyword colorizing.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all ${
                  isSelected
                    ? "border-sky-500 bg-slate-900/90 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50"
                    : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 uppercase">
                      {tpl.animation}
                    </span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  {/* Visual Subtitle Preview Badge */}
                  <div className="h-24 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-3 text-center">
                    <span
                      style={{
                        fontFamily: tpl.font_family,
                        fontSize: "17px",
                        fontWeight: tpl.bold ? 800 : 500,
                      }}
                      className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    >
                      THIS IS <span className="text-amber-400">VIRAL</span> CAPTION
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{tpl.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Font: {tpl.font_family} ({tpl.font_size}pt)
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
