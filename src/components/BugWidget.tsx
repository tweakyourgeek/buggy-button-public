import { useState } from "react";
import { Bug, X } from "lucide-react";
import BugReportForm from "./BugReportForm";

export default function BugWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-bug-fab text-bug-fab-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label="Report a bug"
        >
          <Bug size={26} />
        </button>
      )}

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug size={20} className="text-bug-accent" />
                <h2 className="text-lg font-bold text-foreground">Report a Bug</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <BugReportForm onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
