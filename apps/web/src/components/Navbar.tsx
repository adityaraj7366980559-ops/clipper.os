"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Video,
  PlusCircle,
  Calendar,
  Sparkles,
  Palette,
  Settings,
  CreditCard,
  Zap,
  Command,
} from "lucide-react";
import { fetchSystemMode } from "../lib/api";

export function Navbar({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
  const pathname = usePathname();
  const [systemMode, setSystemMode] = useState<string>("Local AI Mode");

  useEffect(() => {
    fetchSystemMode().then((data) => {
      if (data?.mode) setSystemMode(data.mode);
    }).catch(() => {});
  }, []);

  const navLinks = [
    { label: "Projects", href: "/", icon: Video },
    { label: "Templates", href: "/templates", icon: Sparkles },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Brand Kits", href: "/brand", icon: Palette },
    { label: "Billing", href: "/billing", icon: CreditCard },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Sparkles className="h-4 w-4 text-sky-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg text-white">ClipForge</span>
              <span className="rounded bg-sky-500/10 px-1.5 py-0.2 text-[10px] font-bold text-sky-400 border border-sky-500/20">PRO</span>
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-800/80 text-white shadow-sm border border-slate-700/60"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* System Mode Pill */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-400">Engine:</span>
          <span className="font-semibold text-emerald-400">{systemMode}</span>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
        >
          <Command className="h-3.5 w-3.5" />
          <span>K</span>
        </button>

        {/* Credits usage pill */}
        <Link
          href="/billing"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-all"
        >
          <Zap className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
          <span>266m left</span>
        </Link>

        {/* New Project CTA */}
        <Link
          href="/new"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition-opacity"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Project</span>
        </Link>
      </div>
    </header>
  );
}
