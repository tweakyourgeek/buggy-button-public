import { useRef, useState, useEffect, useCallback } from "react";
import { Pencil, Circle, Square, Undo2, Trash2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tool = "pen" | "circle" | "rect";
type Color = string;

interface Point { x: number; y: number }

interface DrawAction {
  tool: Tool;
  color: Color;
  lineWidth: number;
  points?: Point[];       // pen
  start?: Point;          // circle / rect
  end?: Point;
}

const COLORS: Color[] = [
  "hsl(0 84% 60%)",   // red
  "hsl(45 93% 47%)",  // amber
  "hsl(142 71% 45%)", // green
  "hsl(217 91% 60%)", // blue
  "hsl(0 0% 100%)",   // white
];

interface Props {
  screenshot: string;
  onSave: (annotated: string) => void;
}

export default function ScreenshotAnnotator({ screenshot, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<Color>(COLORS[0]);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load the background image once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = screenshot;
  }, [screenshot]);

  const getCanvasSize = useCallback(() => {
    const container = containerRef.current;
    if (!container || !imgRef.current) return { w: 300, h: 200 };
    const w = container.clientWidth;
    const ratio = imgRef.current.height / imgRef.current.width;
    return { w, h: Math.round(w * ratio) };
  }, []);

  // Redraw everything
  const redraw = useCallback(
    (extraAction?: DrawAction | null) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;
      const ctx = canvas.getContext("2d")!;
      const { w, h } = getCanvasSize();
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const toDraw = extraAction ? [...actions, extraAction] : actions;
      for (const a of toDraw) {
        ctx.strokeStyle = a.color;
        ctx.lineWidth = a.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (a.tool === "pen" && a.points && a.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(a.points[0].x, a.points[0].y);
          for (let i = 1; i < a.points.length; i++) {
            ctx.lineTo(a.points[i].x, a.points[i].y);
          }
          ctx.stroke();
        } else if (a.tool === "rect" && a.start && a.end) {
          ctx.strokeRect(a.start.x, a.start.y, a.end.x - a.start.x, a.end.y - a.start.y);
        } else if (a.tool === "circle" && a.start && a.end) {
          const rx = (a.end.x - a.start.x) / 2;
          const ry = (a.end.y - a.start.y) / 2;
          ctx.beginPath();
          ctx.ellipse(a.start.x + rx, a.start.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    [actions, getCanvasSize],
  );

  useEffect(() => {
    if (imgLoaded) redraw();
  }, [imgLoaded, redraw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    const action: DrawAction = {
      tool,
      color,
      lineWidth: 3,
      ...(tool === "pen" ? { points: [pos] } : { start: pos, end: pos }),
    };
    setCurrentAction(action);
    setDrawing(true);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !currentAction) return;
    e.preventDefault();
    const pos = getPos(e);
    const updated = { ...currentAction };
    if (tool === "pen") {
      updated.points = [...(updated.points || []), pos];
    } else {
      updated.end = pos;
    }
    setCurrentAction(updated);
    redraw(updated);
  };

  const endDraw = () => {
    if (!drawing || !currentAction) return;
    setActions((prev) => [...prev, currentAction]);
    setCurrentAction(null);
    setDrawing(false);
  };

  const undo = () => {
    setActions((prev) => {
      const next = prev.slice(0, -1);
      // redraw will fire via effect
      return next;
    });
  };

  const clear = () => setActions([]);

  const save = () => {
    redraw();
    // Small delay to ensure canvas is painted
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      onSave(canvas.toDataURL("image/png"));
    });
  };

  const toolBtnClass = (t: Tool) =>
    `rounded-md p-1.5 transition-colors ${tool === t ? "bg-bug-accent text-bug-accent-foreground" : "text-muted-foreground hover:bg-muted"}`;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" className={toolBtnClass("pen")} onClick={() => setTool("pen")} title="Pen">
          <Pencil size={16} />
        </button>
        <button type="button" className={toolBtnClass("rect")} onClick={() => setTool("rect")} title="Rectangle">
          <Square size={16} />
        </button>
        <button type="button" className={toolBtnClass("circle")} onClick={() => setTool("circle")} title="Ellipse">
          <Circle size={16} />
        </button>

        <span className="mx-1 h-5 w-px bg-border" />

        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-foreground" : "border-transparent"}`}
            style={{ backgroundColor: c }}
            title="Color"
          />
        ))}

        <span className="mx-1 h-5 w-px bg-border" />

        <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" onClick={undo} title="Undo" disabled={actions.length === 0}>
          <Undo2 size={16} />
        </button>
        <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" onClick={clear} title="Clear all" disabled={actions.length === 0}>
          <Trash2 size={16} />
        </button>

        <div className="ml-auto">
          <Button type="button" size="sm" variant="outline" onClick={save} className="text-xs">
            Done
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg border border-border cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="block w-full touch-none"
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
        />
      </div>
    </div>
  );
}
