"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  PlusCircle,
  Video,
  Sparkles,
  Calendar,
  Palette,
  CreditCard,
  Settings,
  X,
  Play,
} from "lucide-react";

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else if (onClose) (onClose as any)(true);
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { label: "Create New AI Video Project", icon: PlusCircle, href: "/new", shortcut: "N" },
    { label: "View All Video Projects", icon: Video, href: "/", shortcut: "P" },
    { label: "Browse 25+ Animated Caption Templates", icon: Sparkles, href: "/templates", shortcut: "T" },
    { label: "Social Publishing & Scheduling Calendar", icon: Calendar, href: "/calendar", shortcut: "C" },
    { label: "Brand Kits & Custom Watermarks", icon: Palette, href: "/brand", shortcut: "B" },
    { label: "Account Usage & Subscription Plans", icon: CreditCard, href: "/billing", shortcut: "U" },
    { label: "AI Models & Provider Settings", icon: Settings, href: "/settings", shortcut: "S" },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No actions found.</div>
          ) : (
            filtered.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    router.push(action.href);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-sky-400" />
                    <span>{action.label}</span>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                    {action.shortcut}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
