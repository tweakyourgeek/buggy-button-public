export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  email?: string;
  createdAt: Date;
}

const reports: BugReport[] = [];

export const bugStore = {
  submit(data: Omit<BugReport, "id" | "createdAt">): BugReport {
    const report: BugReport = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    reports.push(report);
    return report;
  },
  getAll(): BugReport[] {
    return [...reports];
  },
};
