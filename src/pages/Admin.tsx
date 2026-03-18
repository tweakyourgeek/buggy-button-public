import { useState, useMemo } from "react";
import { bugStore, BugReport, BugStatus, BugSeverity } from "@/lib/bugStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Search, X, ArrowLeft, ExternalLink, Monitor, Mail, Clock, AlertTriangle, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const severityColor: Record<BugSeverity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-bug-accent/20 text-bug-accent-foreground border border-bug-accent/40",
  high: "bg-destructive/20 text-destructive border border-destructive/40",
  critical: "bg-destructive text-destructive-foreground",
};

const statusColor: Record<BugStatus, string> = {
  open: "bg-primary/10 text-primary border border-primary/30",
  in_progress: "bg-bug-accent/20 text-bug-accent-foreground border border-bug-accent/40",
  resolved: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  closed: "bg-muted text-muted-foreground",
};

const statusLabel: Record<BugStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const [bugs, setBugs] = useState<BugReport[]>(bugStore.getAll());
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);

  const refresh = () => setBugs(bugStore.getAll());

  const filtered = useMemo(() => {
    return bugs.filter((b) => {
      const matchSearch =
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = filterSeverity === "all" || b.severity === filterSeverity;
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [bugs, search, filterSeverity, filterStatus]);

  const selectedBug = selectedBugId ? bugs.find((b) => b.id === selectedBugId) : null;

  const handleStatusChange = (id: string, status: BugStatus) => {
    bugStore.updateStatus(id, status);
    refresh();
  };

  const handleDelete = (id: string) => {
    bugStore.deleteReport(id);
    setSelectedBugId(null);
    refresh();
  };

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: bugs.length };
    bugs.forEach((b) => c[b.status]++);
    return c;
  }, [bugs]);

  if (selectedBug) {
    return <BugDetail bug={selectedBug} onBack={() => setSelectedBugId(null)} onStatusChange={handleStatusChange} onDelete={handleDelete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bug-fab text-bug-fab-foreground">
              <Bug size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Bug Reports</h1>
              <p className="text-xs text-muted-foreground">{counts.total} total reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(bugStore.exportJSON(), `bugs-${format(new Date(), "yyyy-MM-dd")}.json`, "application/json")}
              disabled={bugs.length === 0}
            >
              <Download size={14} className="mr-1" /> JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(bugStore.exportCSV(), `bugs-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv")}
              disabled={bugs.length === 0}
            >
              <Download size={14} className="mr-1" /> CSV
            </Button>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft size={14} className="mr-1" /> Back to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["open", "in_progress", "resolved", "closed"] as BugStatus[]).map((s) => (
            <Card
              key={s}
              className={`cursor-pointer transition-shadow hover:shadow-md ${filterStatus === s ? "ring-2 ring-bug-accent" : ""}`}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            >
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{statusLabel[s]}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{counts[s]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Bug</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    {bugs.length === 0 ? "No bug reports yet. Reports submitted via the widget will appear here." : "No bugs match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((bug) => (
                  <TableRow
                    key={bug.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedBugId(bug.id)}
                  >
                    <TableCell>
                      <p className="font-medium text-foreground">{bug.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{bug.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityColor[bug.severity]}>
                        {bug.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[bug.status]}>
                        {statusLabel[bug.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {format(bug.createdAt, "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function BugDetail({
  bug,
  onBack,
  onStatusChange,
  onDelete,
}: {
  bug: BugReport;
  onBack: () => void;
  onStatusChange: (id: string, status: BugStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={16} />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{bug.title}</h1>
            <p className="text-xs text-muted-foreground">#{bug.id.slice(0, 8)}</p>
          </div>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(bug.id)}>
            <Trash2 size={14} className="mr-1" /> Delete
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-6 space-y-6">
        {/* Status & Severity row */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={severityColor[bug.severity]}>
            <AlertTriangle size={12} className="mr-1" />
            {bug.severity}
          </Badge>
          <Select value={bug.status} onValueChange={(v) => onStatusChange(bug.id, v as BugStatus)}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{bug.description}</p>
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Reported:</span>
                <span className="text-foreground">{format(bug.createdAt, "MMM d, yyyy 'at' HH:mm")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span className="text-foreground">{format(bug.updatedAt, "MMM d, yyyy 'at' HH:mm")}</span>
              </div>
              {bug.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Reporter:</span>
                  <span className="text-foreground">{bug.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              {bug.url && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">URL:</span>
                  <span className="text-foreground truncate">{bug.url}</span>
                </div>
              )}
              {bug.userAgent && (
                <div className="flex items-start gap-2 text-sm">
                  <Monitor size={14} className="text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground shrink-0">Browser:</span>
                  <span className="text-foreground text-xs break-all">{bug.userAgent}</span>
                </div>
              )}
              {bug.viewportSize && (
                <div className="flex items-center gap-2 text-sm">
                  <Monitor size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Viewport:</span>
                  <span className="text-foreground">{bug.viewportSize}</span>
                </div>
              )}
              {bug.consoleErrors && bug.consoleErrors.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} className="text-destructive mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">Console Errors ({bug.consoleErrors.length}):</span>
                    <ul className="mt-1 space-y-1">
                      {bug.consoleErrors.map((err, i) => (
                        <li key={i} className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1 break-all">{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {!bug.url && !bug.userAgent && !bug.viewportSize && (
                <p className="text-sm text-muted-foreground">No browser metadata captured.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Screenshot */}
        {bug.screenshot && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Screenshot</CardTitle>
            </CardHeader>
            <CardContent>
              <img src={bug.screenshot} alt="Bug screenshot" className="w-full rounded-lg border border-border" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
