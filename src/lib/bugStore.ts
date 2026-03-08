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
  createdAt: Date;
  updatedAt: Date;
  url?: string;
  userAgent?: string;
  viewportSize?: string;
  consoleErrors?: string[];
}

// Mock data for the admin dashboard
const mockBugs: BugReport[] = [
  {
    id: "bug-001",
    title: "Login button unresponsive on mobile",
    description: "When tapping the login button on iPhone Safari, nothing happens. The button appears to receive the tap (visual feedback) but the form doesn't submit. Tested on iPhone 14 Pro, iOS 17.2.",
    severity: "critical",
    status: "open",
    email: "sarah@example.com",
    createdAt: new Date("2026-03-07T14:23:00"),
    updatedAt: new Date("2026-03-07T14:23:00"),
    url: "https://app.example.com/login",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15",
  },
  {
    id: "bug-002",
    title: "Dashboard chart renders blank on Firefox",
    description: "The revenue chart on the dashboard page shows a blank white area in Firefox 122. Works fine in Chrome and Edge. No console errors visible.",
    severity: "high",
    status: "in_progress",
    email: "mike@example.com",
    createdAt: new Date("2026-03-06T09:15:00"),
    updatedAt: new Date("2026-03-07T11:00:00"),
    url: "https://app.example.com/dashboard",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  },
  {
    id: "bug-003",
    title: "Typo in onboarding welcome message",
    description: 'The welcome message says "Welcone to our platform" instead of "Welcome to our platform".',
    severity: "low",
    status: "resolved",
    createdAt: new Date("2026-03-05T16:42:00"),
    updatedAt: new Date("2026-03-06T08:30:00"),
    url: "https://app.example.com/onboarding",
  },
  {
    id: "bug-004",
    title: "File upload fails for files over 5MB",
    description: "Attempting to upload a PDF larger than 5MB results in a generic 'Upload failed' error. The API returns a 413 but the UI doesn't show a helpful message about file size limits.",
    severity: "medium",
    status: "open",
    email: "jessica@example.com",
    createdAt: new Date("2026-03-07T10:05:00"),
    updatedAt: new Date("2026-03-07T10:05:00"),
    url: "https://app.example.com/settings/profile",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  },
  {
    id: "bug-005",
    title: "Dark mode toggle doesn't persist",
    description: "When I enable dark mode and refresh the page, it reverts to light mode. Expected the preference to be saved.",
    severity: "medium",
    status: "closed",
    email: "alex@example.com",
    createdAt: new Date("2026-03-03T20:11:00"),
    updatedAt: new Date("2026-03-05T14:00:00"),
  },
  {
    id: "bug-006",
    title: "Notification badge count incorrect",
    description: "The notification bell shows 3 unread but I have 7 unread notifications when I open the panel. The count seems to stop updating after the initial load.",
    severity: "high",
    status: "open",
    email: "tom@example.com",
    createdAt: new Date("2026-03-08T08:30:00"),
    updatedAt: new Date("2026-03-08T08:30:00"),
    url: "https://app.example.com/notifications",
  },
];

const reports: BugReport[] = [...mockBugs];

export const bugStore = {
  submit(data: Omit<BugReport, "id" | "createdAt" | "updatedAt" | "status">): BugReport {
    const now = new Date();
    const report: BugReport = {
      ...data,
      id: crypto.randomUUID(),
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    reports.unshift(report);
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
    }
    return report;
  },
};
