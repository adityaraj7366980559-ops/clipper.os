import { Project, Clip, CaptionTemplate, BrandKit, SocialPost } from "../types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

// Helper to get backend origin (e.g. "https://api.clipforge.app" from "https://api.clipforge.app/api/v1")
export function getBackendBaseUrl(): string {
  if (API_BASE) {
    return API_BASE.replace(/\/api\/v1\/?$/, "");
  }
  return "";
}

// Helper to construct full URL for media / static proxy files
export function getMediaUrl(path: string | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  const base = getBackendBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

// Helper to get WebSocket URL for live progress
export function getWebSocketProgressUrl(): string {
  const base = getBackendBaseUrl();
  if (base) {
    const wsProto = base.startsWith("https") ? "wss:" : "ws:";
    const host = base.replace(/^https?:\/\//, "");
    return `${wsProto}//${host}/ws/progress`;
  }
  if (typeof window !== "undefined") {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${window.location.host}/ws/progress`;
  }
  return "ws://localhost:8000/ws/progress";
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export async function createProjectFromUrl(url: string, title?: string, settings?: any): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, title, settings }),
  });
  if (!res.ok) throw new Error("Failed to create project from URL");
  return res.json();
}

export async function uploadVideoProject(formData: FormData): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload video project");
  return res.json();
}

export async function fetchClip(id: string): Promise<Clip> {
  const res = await fetch(`${API_BASE}/clips/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch clip");
  return res.json();
}

export async function updateClip(id: string, updates: Partial<Clip>): Promise<Clip> {
  const res = await fetch(`${API_BASE}/clips/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update clip");
  return res.json();
}

export async function renderClip(id: string, options: any): Promise<Clip> {
  const res = await fetch(`${API_BASE}/clips/${id}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error("Failed to start render");
  return res.json();
}

export async function fetchTemplates(): Promise<CaptionTemplate[]> {
  const res = await fetch(`${API_BASE}/templates`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

export async function fetchBrandKits(): Promise<BrandKit[]> {
  const res = await fetch(`${API_BASE}/brand-kits`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch brand kits");
  return res.json();
}

export async function schedulePosts(payload: {
  clip_id: string;
  platforms: string[];
  scheduled_at?: string;
  custom_title?: string;
  custom_description?: string;
}): Promise<SocialPost[]> {
  const res = await fetch(`${API_BASE}/publish/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to schedule posts");
  return res.json();
}

export async function fetchScheduledPosts(): Promise<SocialPost[]> {
  const res = await fetch(`${API_BASE}/publish/posts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function fetchSystemMode(): Promise<any> {
  const res = await fetch(`${API_BASE}/extras/system-mode`, { cache: "no-store" });
  if (!res.ok) return { mode: "Full Local (Zero Cost)" };
  return res.json();
}

export async function searchBroll(query: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/media-library/broll?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchMusicTracks(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/media-library/music`);
  if (!res.ok) return [];
  return res.json();
}

export function getSubtitleDownloadUrl(clipId: string, format: "srt" | "ass" | "txt"): string {
  return `${API_BASE}/clips/${clipId}/subtitles/${format}`;
}
