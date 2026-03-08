import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bugStore } from "@/lib/bugStore";
import { CheckCircle, Pencil } from "lucide-react";
import ScreenshotAnnotator from "./ScreenshotAnnotator";
import type { BrowserMetadata } from "./BugWidget";

export default function BugReportForm({ onClose, screenshot, metadata }: { onClose: () => void; screenshot?: string | null; metadata?: BrowserMetadata | null }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("medium");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [annotatedScreenshot, setAnnotatedScreenshot] = useState<string | null>(null);
  const [annotating, setAnnotating] = useState(false);

  const finalScreenshot = annotatedScreenshot || screenshot;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    bugStore.submit({
      title,
      description,
      severity: severity as "low" | "medium" | "high" | "critical",
      email: email || undefined,
      screenshot: finalScreenshot || undefined,
    });
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <CheckCircle className="text-bug-accent" size={48} />
        <p className="text-lg font-semibold text-foreground">Thanks!</p>
        <p className="text-sm text-muted-foreground">Your report has been logged.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="bug-title">Title *</Label>
        <Input
          id="bug-title"
          placeholder="Brief summary of the bug"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bug-desc">Description *</Label>
        <Textarea
          id="bug-desc"
          placeholder="Steps to reproduce, expected vs actual behavior…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Severity</Label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bug-email">Email (optional)</Label>
        <Input
          id="bug-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {screenshot && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Screenshot</Label>
            {!annotating && (
              <button
                type="button"
                onClick={() => setAnnotating(true)}
                className="flex items-center gap-1 text-xs text-bug-accent hover:underline"
              >
                <Pencil size={12} /> Annotate
              </button>
            )}
          </div>

          {annotating ? (
            <ScreenshotAnnotator
              screenshot={screenshot}
              onSave={(data) => {
                setAnnotatedScreenshot(data);
                setAnnotating(false);
              }}
            />
          ) : (
            <img
              src={finalScreenshot || screenshot}
              alt="Captured screenshot"
              className="w-full rounded-lg border border-border"
            />
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-bug-accent text-bug-accent-foreground hover:bg-bug-accent/90">
          Submit
        </Button>
      </div>
    </form>
  );
}
