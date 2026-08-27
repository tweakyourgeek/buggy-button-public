export type BugStatus = "open" | "in_progress" | "resolved" | "closed";
export type BugSeverity = "low" | "medium" | "high" | "critical";

export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  email?: string;
  screenshot?: string;
  video?: string;
  internalNotes?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
  siteUrl?: string;
  flowId?: string;
  userAgent?: string;
  viewportSize?: string;
  consoleErrors?: string[];
  projectName?: string;
}

export interface WidgetConfig {
  projectName: string;
  showBetaBadge: boolean;
  webhookUrl?: string;
  position: "bottom-right" | "bottom-left";
  collectEmail: boolean;
}

const CONFIG_KEY = "bugwidget_config";
const REPORTS_KEY = "bugwidget_reports";

const defaultConfig: WidgetConfig = {
  projectName: "My App",
  showBetaBadge: true,
  position: "bottom-right",
  collectEmail: true,
};

function loadReports(): BugReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((r: Record<string, unknown>) => ({
      ...r,
      createdAt: new Date(r.createdAt as string),
      updatedAt: new Date(r.updatedAt as string),
    }));
  } catch {
    return [];
  }
}

function saveReports(reports: BugReport[]) {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

function loadConfig(): WidgetConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...defaultConfig };
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return { ...defaultConfig };
  }
}

function saveConfig(config: WidgetConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // silent fail
  }
}

let reports: BugReport[] = loadReports();
let config: WidgetConfig = loadConfig();

async function callWebhook(report: BugReport) {
  if (!config.webhookUrl) return;
  try {
    await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...report,
        screenshot: undefined, // Don't send large screenshots over webhook
      }),
    });
  } catch {
    // Webhook delivery is best-effort
  }
}

export const bugStore = {
  submit(data: Omit<BugReport, "id" | "createdAt" | "updatedAt" | "status">): BugReport {
    const now = new Date();
    const report: BugReport = {
      ...data,
      id: crypto.randomUUID(),
      status: "open",
      projectName: config.projectName,
      createdAt: now,
      updatedAt: now,
    };
    reports.unshift(report);
    saveReports(reports);
    callWebhook(report);
    return report;
  },

  getAll(): BugReport[] {
    return [...reports];
  },

  getById(id: string): BugReport | undefined {
    return reports.find((r) => r.id === id);
  },

  updateStatus(id: string, status: BugStatus): BugReport | undefined {
    const report = reports.find((r) => r.id === id);
    if (report) {
      report.status = status;
      report.updatedAt = new Date();
      saveReports(reports);
    }
    return report;
  },

  deleteReport(id: string): boolean {
    const idx = reports.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    reports.splice(idx, 1);
    saveReports(reports);
    return true;
  },

  clearAll() {
    reports = [];
    saveReports(reports);
  },

  getConfig(): WidgetConfig {
    return { ...config };
  },

  updateConfig(partial: Partial<WidgetConfig>) {
    config = { ...config, ...partial };
    saveConfig(config);
  },

  exportJSON(): string {
    return JSON.stringify(reports, null, 2);
  },

  exportCSV(): string {
    const headers = ["id", "title", "description", "severity", "status", "email", "url", "userAgent", "viewportSize", "projectName", "createdAt", "updatedAt"];
    const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = reports.map((r) =>
      headers.map((h) => escape(String((r as Record<string, unknown>)[h] ?? ""))).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  },
};
