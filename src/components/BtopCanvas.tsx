import { useEffect, useRef, useState } from 'react';
import { COLS, ROWS } from '../utils/btop';
import type { BtopRow } from '../utils/btop';

// 字體大小上下限：太小看不清楚，太大就變醜，超出時改用捲動
const MIN_FONT = 7;
const MAX_FONT = 13;
const LINE_HEIGHT = 1.2;
const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace";
const DEFAULT_TEXT = '#e6edf3';

interface Metrics {
  font: number;
  cellW: number;
  cellH: number;
}

// 用 canvas 直接畫整個 190 × 50 的格子。沒有 DOM 節點，方塊與框線也一定在自己的格子裡，欄位不會錯位。
const BtopCanvas = ({ rows }: { rows: BtopRow[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  // 依容器大小決定字體，超過上下限就用固定大小，靠外層捲動
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = canvas?.parentElement;
    if (!canvas || !box) return;

    const measure = () => {
      const probe = canvas.getContext('2d');
      if (!probe) return;
      probe.font = `100px ${FONT}`;
      const advance = probe.measureText('M').width / 100;
      const fit = Math.min(box.clientWidth / (COLS * advance), box.clientHeight / (ROWS * LINE_HEIGHT));
      const font = Math.min(MAX_FONT, Math.max(MIN_FONT, Math.floor(fit * 10) / 10));
      setMetrics({ font, cellW: font * advance, cellH: font * LINE_HEIGHT });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !metrics) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = COLS * metrics.cellW;
    const height = ROWS * metrics.cellH;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${metrics.font}px ${FONT}`;
    ctx.textBaseline = 'top';

    const { cellW, cellH } = metrics;
    rows.forEach((row, y) => {
      let col = 0;
      for (const run of row) {
        const len = [...run.text].length;
        if (run.bg) {
          ctx.fillStyle = run.bg;
          ctx.fillRect(col * cellW, y * cellH, len * cellW, cellH);
        }
        ctx.fillStyle = run.color ?? DEFAULT_TEXT;

        // ASCII 連續字元一次畫完；非 ASCII 字元逐格畫在自己的格子左上角
        let segment = '';
        let segmentCol = col;
        const flush = () => {
          if (segment) ctx.fillText(segment, segmentCol * cellW, y * cellH);
          segment = '';
        };
        for (const ch of run.text) {
          if (ch <= '\x7f') {
            if (!segment) segmentCol = col;
            segment += ch;
          } else {
            flush();
            ctx.fillText(ch, col * cellW, y * cellH);
          }
          col++;
        }
        flush();
      }
    });
  }, [rows, metrics]);

  return <canvas ref={canvasRef} className="terminal-btop-canvas" aria-label="btop" />;
};

export default BtopCanvas;
