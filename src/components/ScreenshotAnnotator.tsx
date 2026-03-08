import { useRef, useState, useEffect, useCallback } from "react";
import { Pencil, Circle, Square, Undo2, Trash2, MoveUpRight, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tool = "pen" | "circle" | "rect" | "arrow" | "text";
type Color = string;

interface Point { x: number; y: number }

interface DrawAction {
  tool: Tool;
  color: Color;
  lineWidth: number;
  points?: Point[];       // pen
  start?: Point;          // circle / rect / arrow
  end?: Point;
  text?: string;          // text tool
}

const COLORS: Color[] = [
  "hsl(0 84% 60%)",
  "hsl(45 93% 47%)",
  "hsl(142 71% 45%)",
  "hsl(217 91% 60%)",
  "hsl(0 0% 100%)",
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
  const [lineWidth, setLineWidth] = useState(3);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [textInput, setTextInput] = useState<{ pos: Point; visible: boolean }>({ pos: { x: 0, y: 0 }, visible: false });
  const [textValue, setTextValue] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

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

  const drawArrow = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    const headLen = 14;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

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
        ctx.fillStyle = a.color;
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
        } else if (a.tool === "arrow" && a.start && a.end) {
          drawArrow(ctx, a.start, a.end);
        } else if (a.tool === "text" && a.start && a.text) {
          ctx.font = "bold 16px sans-serif";
          // Draw text background for readability
          const metrics = ctx.measureText(a.text);
          const padding = 4;
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(a.start.x - padding, a.start.y - 16 - padding, metrics.width + padding * 2, 20 + padding * 2);
          ctx.fillStyle = a.color;
          ctx.fillText(a.text, a.start.x, a.start.y);
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

  const commitText = () => {
    if (textValue.trim()) {
      setActions((prev) => [
        ...prev,
        { tool: "text", color, lineWidth, start: textInput.pos, text: textValue },
      ]);
    }
    setTextInput({ pos: { x: 0, y: 0 }, visible: false });
    setTextValue("");
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (textInput.visible) {
      commitText();
      return;
    }
    const pos = getPos(e);
    if (tool === "text") {
      setTextInput({ pos, visible: true });
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }
    const action: DrawAction = {
      tool,
      color,
      lineWidth,
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

  const undo = () => setActions((prev) => prev.slice(0, -1));
  const clear = () => setActions([]);

  const save = () => {
    if (textInput.visible) commitText();
    redraw();
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
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" className={toolBtnClass("pen")} onClick={() => setTool("pen")} title="Pen">
          <Pencil size={16} />
        </button>
        <button type="button" className={toolBtnClass("arrow")} onClick={() => setTool("arrow")} title="Arrow">
          <MoveUpRight size={16} />
        </button>
        <button type="button" className={toolBtnClass("rect")} onClick={() => setTool("rect")} title="Rectangle">
          <Square size={16} />
        </button>
        <button type="button" className={toolBtnClass("circle")} onClick={() => setTool("circle")} title="Ellipse">
          <Circle size={16} />
        </button>
        <button type="button" className={toolBtnClass("text")} onClick={() => setTool("text")} title="Text">
          <Type size={16} />
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

        {[2, 3, 5, 8].map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setLineWidth(w)}
            title={`Size ${w}`}
            className={`flex items-center justify-center h-6 w-6 rounded-md transition-colors ${lineWidth === w ? "bg-bug-accent text-bug-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <span className="rounded-full bg-current" style={{ width: w + 2, height: w + 2 }} />
          </button>
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
        {textInput.visible && (
          <input
            ref={textInputRef}
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitText(); if (e.key === "Escape") { setTextInput({ pos: { x: 0, y: 0 }, visible: false }); setTextValue(""); } }}
            className="absolute bg-black/60 text-white text-sm px-1.5 py-0.5 rounded border border-white/30 outline-none min-w-[80px]"
            style={{ left: textInput.pos.x, top: textInput.pos.y - 20 }}
            placeholder="Type label…"
          />
        )}
      </div>
    </div>
  );
}
