"use client";

import React, { useState } from "react";
import { Zap, Check, ShieldCheck, Sparkles, CreditCard, ArrowRight } from "lucide-react";

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const plans = [
    {
      id: "free",
      name: "Starter Free",
      price: "$0",
      period: "forever",
      desc: "Perfect for testing and casual creators.",
      minutes: "60 mins / mo",
      features: [
        "720p HD Exports",
        "OpusClip-grade AI virality scoring",
        "5 Basic Caption Templates",
        "ClipForge Watermark included",
      ],
      buttonText: "Current Free Tier",
      active: false,
    },
    {
      id: "pro",
      name: "Creator Pro",
      price: "$29",
      period: "per month",
      desc: "For serious YouTubers, podcasters, and agencies.",
      minutes: "300 mins / mo",
      features: [
        "1080p & 4K UHD Video Rendering",
        "All 25+ Animated Caption Presets",
        "Watermark-Free Exports",
        "AI Active-Speaker Auto Reframe (9:16)",
        "Direct YouTube Shorts Auto-Scheduling",
        "One-Click Filler & Silence Removal",
        "AI B-Roll Stock Footage Integration",
      ],
      buttonText: "Active Subscription",
      active: true,
      popular: true,
    },
    {
      id: "business",
      name: "Studio Enterprise",
      price: "$99",
      period: "per month",
      desc: "For media companies and multi-show production studios.",
      minutes: "1,200 mins / mo",
      features: [
        "Unlimited 4K Rendering Queue",
        "Dedicated Team Workspaces (5 Seats)",
        "Custom Font & Watermark Brand Kits",
        "Multi-Platform Social Auto-Publisher",
        "Priority GPU Encoding Cluster",
        "Full REST API & Webhook Access",
      ],
      buttonText: "Upgrade to Business",
      active: false,
    },
  ];

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Billing & Credits</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your processing allocation, plan tiers, and rendering quotas.
        </p>
      </div>

      {/* Usage Meter Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Plan: Creator Pro
            </span>
            <h2 className="text-2xl font-black text-white mt-1">
              266 minutes remaining <span className="text-xs text-slate-400 font-normal">/ 300 mins</span>
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4" />
            <span>Cycle resets Dec 1, 2026</span>
          </span>
        </div>

        {/* Meter Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
              style={{ width: "11.3%" }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>34 mins processed</span>
            <span>300 mins total monthly quota</span>
          </div>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-7 transition-all ${
                p.popular
                  ? "border-sky-500 bg-slate-900/90 shadow-2xl shadow-sky-500/10 ring-1 ring-sky-500/50"
                  : "border-slate-800 bg-slate-900/40"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-3.5 py-0.5 text-[10px] font-black uppercase text-white shadow-md">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{p.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-xs text-slate-400">/{p.period}</span>
                </div>

                <div className="inline-flex rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-sky-400 border border-slate-800">
                  {p.minutes}
                </div>

                <div className="space-y-3 pt-2">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => alert(`Stripe Checkout Session initialized for plan: ${p.name}`)}
                  className={`w-full rounded-xl py-3 text-xs font-bold transition-all ${
                    p.active
                      ? "bg-slate-800 text-white cursor-default"
                      : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg hover:opacity-95"
                  }`}
                >
                  {p.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
