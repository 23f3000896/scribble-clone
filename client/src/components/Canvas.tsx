import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawStroke, DrawPoint } from '../types';
import { 
  Paintbrush, 
  Eraser, 
  PaintBucket, 
  Undo2, 
  Trash2, 
  Circle
} from 'lucide-react';

interface CanvasProps {
  isDrawer: boolean;
  strokes: DrawStroke[];
  onEmitStroke: (stroke: DrawStroke) => void;
  onEmitUndo: () => void;
  onEmitClear: () => void;
}

const PALETTE = [
  '#000000', '#ffffff', '#64748b', '#94a3b8',
  '#ef4444', '#f87171', '#f97316', '#fb923c',
  '#f59e0b', '#fde047', '#10b981', '#4ade80',
  '#06b6d4', '#67e8f9', '#3b82f6', '#60a5fa',
  '#8b5cf6', '#a78bfa', '#ec4899', '#f472b6',
  '#78350f', '#b45309'
];

const BRUSH_SIZES = [
  { size: 4, label: 'Thin' },
  { size: 9, label: 'Medium' },
  { size: 18, label: 'Thick' },
  { size: 32, label: 'Huge' }
];

export const Canvas: React.FC<CanvasProps> = ({
  isDrawer,
  strokes,
  onEmitStroke,
  onEmitUndo,
  onEmitClear
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tools state
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(9);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const currentPointsRef = useRef<DrawPoint[]>([]);

  // Coordinate normalizer helper
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y };
  };

  // Redraw canvas from strokes
  const renderAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // Reset with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    for (const stroke of strokes) {
      if (stroke.type === 'fill') {
        // Flood fill simulation
        if (stroke.points.length > 0) {
          executeFloodFill(ctx, stroke.points[0].x * width, stroke.points[0].y * height, stroke.color, width, height);
        }
      } else {
        const color = stroke.type === 'eraser' ? '#ffffff' : stroke.color;
        const strokeWidth = stroke.size * (width / 800); // Scale size relative to baseline 800px

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.points.length === 1) {
          // Dot
          ctx.beginPath();
          ctx.arc(stroke.points[0].x * width, stroke.points[0].y * height, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (stroke.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
          }
          ctx.stroke();
        }
      }
    }
  }, [strokes]);

  // Adjust canvas resolution dynamically based on container size
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const targetWidth = Math.floor(rect.width);
      // 4:3 aspect ratio like standard skribbl
      const targetHeight = Math.floor(rect.height);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        renderAllStrokes();
      }
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [renderAllStrokes]);

  // Redraw when strokes change
  useEffect(() => {
    renderAllStrokes();
  }, [strokes, renderAllStrokes]);

  // Flood fill algorithm
  const executeFloodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColorHex: string,
    width: number,
    height: number
  ) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    // Convert hex to rgb
    const r = parseInt(fillColorHex.slice(1, 3), 16);
    const g = parseInt(fillColorHex.slice(3, 5), 16);
    const b = parseInt(fillColorHex.slice(5, 7), 16);
    const a = 255;

    if (
      Math.abs(targetR - r) < 10 &&
      Math.abs(targetG - g) < 10 &&
      Math.abs(targetB - b) < 10 &&
      Math.abs(targetA - a) < 10
    ) {
      return;
    }

    const matchTarget = (idx: number) => {
      return (
        Math.abs(data[idx] - targetR) < 30 &&
        Math.abs(data[idx + 1] - targetG) < 30 &&
        Math.abs(data[idx + 2] - targetB) < 30 &&
        Math.abs(data[idx + 3] - targetA) < 30
      );
    };

    const queue: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Uint8Array(width * height);

    while (queue.length > 0) {
      const [curX, curY] = queue.pop()!;
      if (curX < 0 || curX >= width || curY < 0 || curY >= height) continue;

      const pIdx = curY * width + curX;
      if (visited[pIdx]) continue;
      visited[pIdx] = 1;

      const idx = pIdx * 4;
      if (matchTarget(idx)) {
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;

        queue.push([curX + 1, curY]);
        queue.push([curX - 1, curY]);
        queue.push([curX, curY + 1]);
        queue.push([curX, curY - 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // Drawing event handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    if (activeTool === 'fill') {
      const stroke: DrawStroke = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'fill',
        color: selectedColor,
        size: brushSize,
        points: [pt]
      };
      onEmitStroke(stroke);
      return;
    }

    setIsDrawing(true);
    currentPointsRef.current = [pt];

    // Local preview immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const strokeColor = activeTool === 'eraser' ? '#ffffff' : selectedColor;
        const strokeWidth = brushSize * (canvas.width / 800);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawing || activeTool === 'fill') return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    const pts = currentPointsRef.current;
    const lastPt = pts[pts.length - 1];
    pts.push(pt);

    // Fast local rendering for lag-free responsiveness
    const canvas = canvasRef.current;
    if (canvas && lastPt) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const strokeColor = activeTool === 'eraser' ? '#ffffff' : selectedColor;
        const strokeWidth = brushSize * (canvas.width / 800);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPt.x * canvas.width, lastPt.y * canvas.height);
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        ctx.stroke();
      }
    }
  };

  const handleEnd = () => {
    if (!isDrawer || !isDrawing || activeTool === 'fill') return;
    setIsDrawing(false);

    if (currentPointsRef.current.length > 0) {
      const stroke: DrawStroke = {
        id: Math.random().toString(36).substring(2, 9),
        type: activeTool,
        color: selectedColor,
        size: brushSize,
        points: [...currentPointsRef.current]
      };
      onEmitStroke(stroke);
      currentPointsRef.current = [];
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-slate-700/80">
      {/* Canvas Viewport */}
      <div 
        ref={containerRef} 
        className="relative flex-1 bg-white cursor-crosshair overflow-hidden touch-none select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 w-full h-full block"
        />

        {!isDrawer && (
          <div className="absolute top-3 left-3 bg-slate-900/60 backdrop-blur-sm text-slate-200 text-xs px-3 py-1 rounded-full font-medium pointer-events-none">
            👀 Watching live drawing
          </div>
        )}
      </div>

      {/* Drawer Control Toolbar (visible only to active drawer) */}
      {isDrawer && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 border-t-2 border-slate-300">
          {/* Tool switchers */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTool('brush')}
              title="Brush Tool"
              className={`p-2 rounded-lg transition-all ${
                activeTool === 'brush' ? 'bg-amber-400 text-slate-900 shadow-sm font-bold' : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Paintbrush className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('fill')}
              title="Fill Bucket"
              className={`p-2 rounded-lg transition-all ${
                activeTool === 'fill' ? 'bg-amber-400 text-slate-900 shadow-sm font-bold' : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              <PaintBucket className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              title="Eraser"
              className={`p-2 rounded-lg transition-all ${
                activeTool === 'eraser' ? 'bg-amber-400 text-slate-900 shadow-sm font-bold' : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-xl">
            {BRUSH_SIZES.map(({ size, label }) => (
              <button
                key={size}
                type="button"
                onClick={() => setBrushSize(size)}
                title={`${label} Brush`}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                  brushSize === size ? 'bg-amber-400 shadow-sm' : 'hover:bg-slate-300'
                }`}
              >
                <div
                  className="rounded-full bg-slate-800"
                  style={{ width: Math.min(22, Math.max(4, size * 0.7)), height: Math.min(22, Math.max(4, size * 0.7)) }}
                />
              </button>
            ))}
          </div>

          {/* Color Palette */}
          <div className="grid grid-cols-11 gap-1 max-w-xs">
            {PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setSelectedColor(color);
                  if (activeTool === 'eraser') setActiveTool('brush');
                }}
                className={`w-5 h-5 rounded-md border transition-transform ${
                  selectedColor === color && activeTool !== 'eraser'
                    ? 'scale-125 border-slate-900 shadow-md ring-2 ring-amber-400 z-10'
                    : 'border-slate-300 hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Actions: Undo & Clear */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={onEmitUndo}
              title="Undo Last Stroke"
              className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={onEmitClear}
              title="Clear Entire Canvas"
              className="flex items-center gap-1 bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
