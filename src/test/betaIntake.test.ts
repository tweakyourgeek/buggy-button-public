// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { betaIntake } from "@/lib/betaIntake";

describe("beta intake local fallback", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reopens the same email-and-code session with saved reports", async () => {
    const session = await betaIntake.openSession(" Tester@Example.com ", " geek-beta-2026 ", "Geek Welcome Leads");
    await betaIntake.saveReport(session.id, {
      title: "The first choice pauses",
      description: "The next node does not appear after the first choice.",
      severity: "high",
      screenshot: "data:image/png;base64,fixture",
      video: "data:video/webm;base64,fixture",
      pageUrl: "https://example.test/welcome",
      userAgent: "Beta Browser",
      viewportSize: "1280x720",
    });

    const reopened = await betaIntake.openSession("tester@example.com", "GEEK-BETA-2026", "Geek Welcome Leads");
    expect(reopened.id).toBe(session.id);
    expect(reopened.reports).toHaveLength(1);
    expect(reopened.reports[0]).toMatchObject({
      title: "The first choice pauses",
      severity: "high",
      screenshot: "data:image/png;base64,fixture",
      video: "data:video/webm;base64,fixture",
    });
  });

  it("requires both email and intake code", async () => {
    await expect(betaIntake.openSession("", "GEEK-BETA-2026")).rejects.toThrow("email address and intake code");
    await expect(betaIntake.openSession("tester@example.com", "")).rejects.toThrow("email address and intake code");
  });
});
