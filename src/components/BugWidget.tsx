import { useState, useCallback } from "react";
import { Bug, X } from "lucide-react";
import html2canvas from "html2canvas";
import BugReportForm from "./BugReportForm";

export default function BugWidget() {
  const [open, setOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const handleOpen = useCallback(async () => {
    setCapturing(true);
    try {
      let target = document.body;
      try {
        // Try parent document for iframe embedding
        if (window.parent && window.parent.document) {
          target = window.parent.document.body;
        }
      } catch {
        // Cross-origin — use current document
      }
      const canvas = await html2canvas(target, {
        useCORS: true,
        logging: false,
        scale: Math.min(window.devicePixelRatio, 1),
        ignoreElements: (el) => el.getAttribute?.("aria-label") === "Report a bug",
      });
      setScreenshot(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      setScreenshot(null);
    }
    setCapturing(false);
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setScreenshot(null);
  };

  return (
    <>
      {!open && (
        <button
          onClick={handleOpen}
          disabled={capturing}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-bug-fab text-bug-fab-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-70"
          aria-label="Report a bug"
        >
          {capturing ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-bug-fab-foreground border-t-transparent" />
          ) : (
            <Bug size={26} />
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug size={20} className="text-bug-accent" />
                <h2 className="text-lg font-bold text-foreground">Report a Bug</h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <BugReportForm onClose={handleClose} screenshot={screenshot} />
          </div>
        </div>
      )}
    </>
  );
}
