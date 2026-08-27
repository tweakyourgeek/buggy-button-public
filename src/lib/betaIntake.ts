export interface BetaSession {
  id: string;
  email: string;
  intakeCode: string;
  product: string;
  createdAt: string;
  updatedAt: string;
  reports: BetaReport[];
}

export interface BetaReport {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  screenshot?: string;
  video?: string;
  pageUrl?: string;
  userAgent?: string;
  viewportSize?: string;
  createdAt: string;
}

interface BetaApiConfig {
  url: string;
  publicKey?: string;
}

const LOCAL_KEY = "buggy_button_beta_sessions";
const apiConfig: BetaApiConfig | null = import.meta.env.VITE_BUGGY_BETA_API_URL
  ? { url: import.meta.env.VITE_BUGGY_BETA_API_URL, publicKey: import.meta.env.VITE_BUGGY_BETA_PUBLIC_KEY }
  : null;
const allowedCodes = new Set(
  String(import.meta.env.VITE_BUGGY_BETA_CODES || "")
    .split(",")
    .map((code) => normalizeCode(code))
    .filter(Boolean),
);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function loadLocal(): BetaSession[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as BetaSession[];
  } catch {
    return [];
  }
}

function saveLocal(sessions: BetaSession[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(sessions));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiConfig) throw new Error("Hosted beta API is not configured.");
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (apiConfig.publicKey) headers.set("X-Buggy-Beta-Key", apiConfig.publicKey);
  const response = await fetch(`${apiConfig.url.replace(/\/$/, "")}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The beta service could not complete that request.");
  return body as T;
}

export const betaIntake = {
  isRemote() {
    return Boolean(apiConfig);
  },

  async openSession(email: string, intakeCode: string, product = "Buggy Button Beta"): Promise<BetaSession> {
    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = normalizeCode(intakeCode);
    if (!normalizedEmail || !normalizedCode) throw new Error("Enter your email address and intake code.");
    if (!apiConfig && allowedCodes.size > 0 && !allowedCodes.has(normalizedCode)) {
      throw new Error("That intake code is not active. Check the invitation and try again.");
    }
    if (apiConfig) {
      const remote = await request<{ id: string; email: string; intakeCode: string; product: string; createdAt: string; updatedAt: string; reports?: Array<Record<string, unknown>> }>("/sessions/open", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, intakeCode: normalizedCode, product }),
      });
      return {
        ...remote,
        reports: (remote.reports || []).map((report) => ({
          id: String(report.id || ""),
          title: String(report.title || ""),
          description: String(report.description || ""),
          severity: (String(report.severity || "medium") as BetaReport["severity"]),
          screenshot: report.screenshot_path ? String(report.screenshot_path) : undefined,
          video: report.video_path ? String(report.video_path) : undefined,
          pageUrl: report.url ? String(report.url) : undefined,
          userAgent: report.user_agent ? String(report.user_agent) : undefined,
          viewportSize: report.viewport_size ? String(report.viewport_size) : undefined,
          createdAt: String(report.created_at || ""),
        })),
      };
    }

    const existing = loadLocal().find((session) => session.email === normalizedEmail && session.intakeCode === normalizedCode);
    if (existing) return existing;
    const now = new Date().toISOString();
    const session: BetaSession = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      intakeCode: normalizedCode,
      product,
      createdAt: now,
      updatedAt: now,
      reports: [],
    };
    const sessions = loadLocal();
    sessions.push(session);
    saveLocal(sessions);
    return session;
  },

  async saveReport(sessionId: string, report: Omit<BetaReport, "id" | "createdAt">): Promise<BetaReport> {
    if (apiConfig) {
      const data = new FormData();
      data.append("title", report.title);
      data.append("description", report.description);
      data.append("severity", report.severity);
      data.append("consent", "1");
      if (report.screenshot) data.append("screenshot", report.screenshot);
      if (report.video) data.append("video", report.video);
      if (report.pageUrl) data.append("pageUrl", report.pageUrl);
      if (report.userAgent) data.append("userAgent", report.userAgent);
      if (report.viewportSize) data.append("viewportSize", report.viewportSize);
      return request<BetaReport>(`/sessions/${encodeURIComponent(sessionId)}/reports`, { method: "POST", body: data });
    }

    const sessions = loadLocal();
    const session = sessions.find((candidate) => candidate.id === sessionId);
    if (!session) throw new Error("Your beta session has expired. Enter the email and intake code again.");
    const saved: BetaReport = { ...report, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    session.reports.unshift(saved);
    session.updatedAt = new Date().toISOString();
    saveLocal(sessions);
    return saved;
  },
};
