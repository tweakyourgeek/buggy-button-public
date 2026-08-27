import type { BugReport, BugSeverity, BugStatus } from "@/lib/bugStore";

const apiUrl = import.meta.env.VITE_BUGGY_BETA_API_URL as string | undefined;
const ADMIN_KEY = "buggy_beta_admin_key";

function getKey() {
  try {
    return sessionStorage.getItem(ADMIN_KEY) || "";
  } catch {
    return "";
  }
}

function normalize(report: Record<string, unknown>): BugReport {
  return {
    id: String(report.id || ""),
    title: String(report.title || "Untitled report"),
    description: String(report.description || ""),
    severity: String(report.severity || "medium") as BugSeverity,
    status: String(report.status || "open") as BugStatus,
    email: report.email ? String(report.email) : undefined,
    screenshot: report.screenshot ? String(report.screenshot) : undefined,
    video: report.video ? String(report.video) : undefined,
    createdAt: new Date(String(report.created_at || report.createdAt || "")),
    updatedAt: new Date(String(report.updated_at || report.updatedAt || "")),
    url: report.url ? String(report.url) : undefined,
    userAgent: report.user_agent ? String(report.user_agent) : undefined,
    viewportSize: report.viewport_size ? String(report.viewport_size) : undefined,
    projectName: report.project_name ? String(report.project_name) : undefined,
    internalNotes: report.internal_notes ? String(report.internal_notes) : undefined,
    assignedTo: report.assigned_to ? String(report.assigned_to) : undefined,
  };
}

async function request<T>(path: string, init: RequestInit = {}, key = getKey()): Promise<T> {
  if (!apiUrl) throw new Error("The shared beta inbox is not configured for this build.");
  if (!key) throw new Error("Enter the shared inbox admin key to continue.");
  const headers = new Headers(init.headers);
  headers.set("X-Buggy-Admin-Key", key);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The shared beta inbox could not complete that request.");
  return body as T;
}

export const remoteAdmin = {
  isConfigured() {
    return Boolean(apiUrl);
  },
  getKey,
  setKey(key: string) {
    try {
      sessionStorage.setItem(ADMIN_KEY, key.trim());
    } catch {
      // Session storage is optional; the caller still receives the key in memory.
    }
  },
  clearKey() {
    try {
      sessionStorage.removeItem(ADMIN_KEY);
    } catch {
      // Ignore storage availability errors.
    }
  },
  async list(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    const result = await request<{ reports: Array<Record<string, unknown>> }>(`/admin/reports${params.toString() ? `?${params}` : ""}`);
    return (result.reports || []).map(normalize);
  },
  async update(id: string, update: { status?: BugStatus; severity?: BugSeverity; internalNotes?: string; assignedTo?: string }) {
    const result = await request<{ report: Record<string, unknown> }>("/admin/reports", { method: "PATCH", body: JSON.stringify({ id, ...update }) });
    return normalize(result.report);
  },
  async remove(id: string) {
    await request(`/admin/reports?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
