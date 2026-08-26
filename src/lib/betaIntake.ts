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
  headers.set("Content-Type", "application/json");
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
    if (apiConfig) return request<BetaSession>("/sessions/open", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, intakeCode: normalizedCode, product }),
    });

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
    if (apiConfig) return request<BetaReport>(`/sessions/${encodeURIComponent(sessionId)}/reports`, {
      method: "POST",
      body: JSON.stringify(report),
    });

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
