import { useState, useCallback, useEffect, useRef } from "react";
import { Bug, X } from "lucide-react";
import html2canvas from "html2canvas";
import BugReportForm from "./BugReportForm";
import { bugStore } from "@/lib/bugStore";

export interface BrowserMetadata {
  url: string;
  userAgent: string;
  viewportSize: string;
  consoleErrors: string[];
}

export default function BugWidget() {
  const [open, setOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [metadata, setMetadata] = useState<BrowserMetadata | null>(null);
  const consoleErrorsRef = useRef<string[]>([]);
  const config = bugStore.getConfig();

  const positionClasses = config.position === "bottom-left"
    ? "bottom-5 left-5"
    : "bottom-5 right-5";

  const modalAlign = config.position === "bottom-left"
    ? "items-end justify-start"
    : "items-end justify-end";

  // Intercept console.error to capture errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      consoleErrorsRef.current.push(args.map(String).join(" "));
      // Keep only last 20
      if (consoleErrorsRef.current.length > 20) consoleErrorsRef.current.shift();
      originalError.apply(console, args);
    };
    return () => { console.error = originalError; };
  }, []);

  const captureMetadata = useCallback((): BrowserMetadata => ({
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    consoleErrors: [...consoleErrorsRef.current],
  }), []);

  const handleOpen = useCallback(async () => {
    setCapturing(true);
    const meta = captureMetadata();
    try {
      let target = document.body;
      try {
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
    setMetadata(meta);
    setCapturing(false);
    setOpen(true);
  }, [captureMetadata]);

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
          className={`fixed ${positionClasses} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-bug-fab text-bug-fab-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-70`}
          aria-label="Report a bug"
        >
          {capturing ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-bug-fab-foreground border-t-transparent" />
          ) : (
            <Bug size={26} />
          )}
          {config.showBetaBadge && (
            <span className="absolute -top-1 -right-1 rounded-full bg-bug-accent px-1.5 py-0.5 text-[10px] font-bold leading-none text-bug-accent-foreground shadow">
              BETA
            </span>
          )}
        </button>
      )}

      {open && (
        <div className={`fixed inset-0 z-50 flex ${modalAlign} p-4 sm:items-center sm:justify-center`}>
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug size={20} className="text-bug-accent" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Report a Bug</h2>
                  <p className="text-xs text-muted-foreground">{config.projectName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <BugReportForm onClose={handleClose} screenshot={screenshot} metadata={metadata} collectEmail={config.collectEmail} />
          </div>
        </div>
      )}
    </>
  );
}
