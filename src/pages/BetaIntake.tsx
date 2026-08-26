/* Design note: preserve Buggy Button’s warm brass, aubergine, and ivory visual system; keep the beta intake calm, evidence-first, and readable on a phone. */
import { useState } from "react";
import html2canvas from "html2canvas";
import { ArrowRight, Bug, Camera, CheckCircle, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { betaIntake, BetaSession } from "@/lib/betaIntake";

const severityLabels = { low: "Low", medium: "Medium", high: "High", critical: "Critical" } as const;

type Severity = keyof typeof severityLabels;

export default function BetaIntake() {
  const query = new URLSearchParams(window.location.search);
  const product = query.get("product") || "Buggy Button Beta";
  const siteUrl = query.get("site_url") || "";
  const pageUrl = query.get("page_url") || "";
  const flowId = query.get("flow_id") || "";
  const [session, setSession] = useState<BetaSession | null>(null);
  const [email, setEmail] = useState("");
  const [intakeCode, setIntakeCode] = useState("");
  const [error, setError] = useState("");
  const [reportSaved, setReportSaved] = useState(false);
  const [capture, setCapture] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "medium" as Severity });

  async function openSession(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setSession(await betaIntake.openSession(email, intakeCode, product));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enter your email address and intake code.");
    }
  }

  async function captureScreenshot() {
    setCapturing(true);
    setError("");
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: Math.min(window.devicePixelRatio, 1),
        ignoreElements: (element) => element.getAttribute?.("data-bug-widget") === "true",
      });
      setCapture(canvas.toDataURL("image/png"));
    } catch {
      setError("The screenshot could not be captured. You can still send the written report.");
    } finally {
      setCapturing(false);
    }
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !form.title.trim() || !form.description.trim()) return;
    setError("");
    try {
      await betaIntake.saveReport(session.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        screenshot: capture || undefined,
        pageUrl: pageUrl || document.referrer || window.location.href,
        userAgent: navigator.userAgent,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      });
      const refreshed = await betaIntake.openSession(session.email, session.intakeCode, session.product);
      setSession(refreshed);
      setForm({ title: "", description: "", severity: "medium" });
      setCapture(null);
      setReportSaved(true);
      window.setTimeout(() => setReportSaved(false), 2600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your report could not be saved. Please try again.");
    }
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
        <div className="mx-auto max-w-xl">
          <header className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bug-fab text-bug-fab-foreground"><Bug size={22} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-bug-accent">Tweak Your Geek</p><h1 className="text-xl font-bold">Buggy Button Beta Desk</h1></div>
          </header>
          <Card className="border-bug-accent/30 shadow-xl">
            <CardHeader><CardTitle className="text-2xl">Enter your beta access</CardTitle><p className="text-sm text-muted-foreground">Use the email address and intake code from your beta invitation. Your saved reports will be available when you return.</p></CardHeader>
            <CardContent>
              <form onSubmit={openSession} className="space-y-5">
                <div className="space-y-2"><Label htmlFor="beta-email">Email address</Label><Input id="beta-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
                <div className="space-y-2"><Label htmlFor="beta-code">Intake code</Label><Input id="beta-code" value={intakeCode} onChange={(event) => setIntakeCode(event.target.value.toUpperCase())} placeholder="GEEK-BETA-2026" autoCapitalize="characters" required /></div>
                {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full bg-bug-accent text-bug-accent-foreground hover:bg-bug-accent/90">Open beta desk <ArrowRight size={16} className="ml-2" /></Button>
                <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-bug-accent" />Reports are connected to this email and code so you can return to them during the beta.</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-bug-accent">{product}</p><h1 className="text-2xl font-bold">Beta feedback desk</h1><p className="text-sm text-muted-foreground">Signed in as {session.email}</p>{siteUrl && <p className="mt-1 text-xs text-muted-foreground">From {siteUrl}{flowId ? ` · Flow ${flowId}` : ""}</p>}</div>
          <Button variant="outline" size="sm" onClick={() => setSession(null)}><LogOut size={14} className="mr-2" />Use another code</Button>
        </header>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card><CardHeader><CardTitle>Report a problem</CardTitle><p className="text-sm text-muted-foreground">Describe the last step you took. A screenshot helps us see the same moment.</p></CardHeader><CardContent><form onSubmit={submitReport} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="report-title">Short summary</Label><Input id="report-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="The flow stops after I choose a service" required /></div>
            <div className="space-y-2"><Label htmlFor="report-description">What happened?</Label><Textarea id="report-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Include the steps, what you expected, and what you saw." rows={6} required /></div>
            <div className="space-y-2"><Label>Priority</Label><Select value={form.severity} onValueChange={(value) => setForm({ ...form, severity: value as Severity })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(severityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="rounded-xl border border-dashed border-bug-accent/50 bg-bug-accent/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Evidence</p><p className="text-xs text-muted-foreground">Capture the current page when it helps explain the report.</p></div><Button type="button" variant="outline" size="sm" onClick={captureScreenshot} disabled={capturing}>{capturing ? "Capturing…" : <><Camera size={14} className="mr-2" />Capture screenshot</>}</Button></div>{capture && <img src={capture} alt="Screenshot ready to attach" className="mt-3 max-h-52 w-full rounded-lg border object-cover" />}</div>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-bug-accent text-bug-accent-foreground hover:bg-bug-accent/90">Send report</Button>
            {reportSaved && <p role="status" className="flex items-center justify-center gap-2 text-sm text-emerald-700"><CheckCircle size={16} />Saved to the beta desk.</p>}
          </form></CardContent></Card>
          <Card><CardHeader><CardTitle>Your reports</CardTitle><p className="text-sm text-muted-foreground">Return with this email and intake code to continue the conversation.</p></CardHeader><CardContent className="space-y-3">{session.reports.length === 0 ? <p className="text-sm text-muted-foreground">No reports saved for this beta session.</p> : session.reports.map((report) => <div key={report.id} className="rounded-xl border border-border p-3"><div className="flex items-start justify-between gap-3"><p className="font-medium">{report.title}</p><Badge variant="outline">{report.severity}</Badge></div><p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{report.description}</p><p className="mt-2 text-xs text-muted-foreground">Submitted {new Date(report.createdAt).toLocaleString()}</p></div>)}</CardContent></Card>
        </div>
      </div>
    </main>
  );
}
