"use client";

import "./globals.css";
import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { CommandPalette } from "../components/CommandPalette";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <html lang="en" className="dark">
      <head>
        <title>ClipForge - AI Video Clipping & Virality Repurposing Platform</title>
        <meta
          name="description"
          content="Turn long podcasts, interviews, webinars, and streams into viral vertical shorts with animated captions, face tracking, and AI B-roll."
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-sky-500/30 selection:text-sky-200">
        <Navbar onOpenCommandPalette={() => setCmdOpen(true)} />
        <main className="flex-1 flex flex-col">{children}</main>
        <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      </body>
    </html>
  );
}
