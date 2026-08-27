import { useState } from "react";
import BugWidget from "@/components/BugWidget";
import { bugStore, WidgetConfig } from "@/lib/bugStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bug, Settings, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const [config, setConfig] = useState<WidgetConfig>(bugStore.getConfig());
  const [saved, setSaved] = useState(false);

  const update = (partial: Partial<WidgetConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    setSaved(false);
  };

  const save = () => {
    bugStore.updateConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const embedSnippet = `<iframe src="${window.location.origin}/widget" style="position:fixed;bottom:0;${config.position === "bottom-left" ? "left" : "right"}:0;width:100%;height:100%;border:none;pointer-events:none;z-index:9999;" allow="clipboard-write"></iframe>`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bug-fab text-bug-fab-foreground">
              <Bug size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Bug Report Widget</h1>
              <p className="text-xs text-muted-foreground">Configure for your beta app</p>
            </div>
          </div>
                        <div className="flex items-center gap-2">
                <Link to="/beta">
                  <Button size="sm" className="bg-bug-accent text-bug-accent-foreground hover:bg-bug-accent/90">Beta Desk</Button>
                </Link>
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    View Reports
                  </Button>
                </Link>
              </div>

        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-6 space-y-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings size={16} /> Widget Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={config.projectName}
                  onChange={(e) => update({ projectName: e.target.value })}
                  placeholder="My App"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="webhook-url">Webhook URL (optional)</Label>
                <Input
                  id="webhook-url"
                  value={config.webhookUrl ?? ""}
                  onChange={(e) => update({ webhookUrl: e.target.value || undefined })}
                  placeholder="https://hooks.slack.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Select value={config.position} onValueChange={(v) => update({ position: v as WidgetConfig["position"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 pt-5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.showBetaBadge}
                    onChange={(e) => update({ showBetaBadge: e.target.checked })}
                    className="rounded border-border"
                  />
                  Show "BETA" badge on button
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.collectEmail}
                    onChange={(e) => update({ collectEmail: e.target.checked })}
                    className="rounded border-border"
                  />
                  Collect reporter email
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} className="bg-bug-accent text-bug-accent-foreground hover:bg-bug-accent/90">
                Save Settings
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle size={14} /> Saved! Reload to see changes.
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Embed Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Embed in Your App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add this snippet to your beta app's HTML to embed the bug report widget:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-foreground">
              <code>{embedSnippet}</code>
            </pre>
            <p className="text-xs text-muted-foreground">
              The hosted <Link to="/beta" className="text-primary underline">Beta Desk</Link> uses email plus an intake code so testers can return to saved reports. The local <Link to="/admin" className="text-primary underline">Admin Dashboard</Link> remains available for development and fallback review.
            </p>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Your beta testers click the bug button (bottom corner of the page)</li>
              <li>A screenshot is captured automatically and can be annotated</li>
              <li>They fill in a title, description, and severity</li>
              <li>Browser metadata (URL, viewport, console errors) is collected</li>
              <li>Reports are saved to localStorage and optionally sent to your webhook</li>
              <li>You review and manage reports in the Admin Dashboard</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Live widget preview */}
      <BugWidget />
    </div>
  );
}
