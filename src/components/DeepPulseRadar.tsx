"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MatchEvent, OrderBookItem } from "@/types/radar";

interface DeepPulseRadarProps {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  spotPrice: number;
  lastMatch: MatchEvent | null;
  selectedPoolLabel: string;
  totals: {
    bidDepth: number;
    askDepth: number;
  };
}

interface ScanImpact {
  id: string;
  side: "bid" | "ask";
  price: number;
  progress: number;
}

interface ScanRow {
  id: string;
  side: "bid" | "ask";
  price: number;
  quantity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
  whale: boolean;
}

interface TradePrint {
  id: string;
  side: "bid" | "ask";
  quantity: number;
  price: number;
  age: number;
}

interface HoverInfo {
  x: number;
  y: number;
  title: string;
  detail: string;
  tone: "bid" | "ask" | "spot";
}

const formatDepth = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const formatPrice = (value: number) =>
  value >= 100 ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${value.toFixed(5)}`;

const colorFor = (side: "bid" | "ask") =>
  side === "bid"
    ? {
        line: "rgba(45, 212, 191, 1)",
        soft: "rgba(45, 212, 191, 0.18)",
        label: "#5eead4",
        fill: "rgba(20, 184, 166, "
      }
    : {
        line: "rgba(251, 113, 133, 1)",
        soft: "rgba(251, 113, 133, 0.18)",
        label: "#fda4af",
        fill: "rgba(244, 63, 94, "
      };

const drawRoundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.min(radius, height / 2, width / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
};

export function DeepPulseRadar({ bids, asks, spotPrice, lastMatch, selectedPoolLabel, totals }: DeepPulseRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bidsRef = useRef<OrderBookItem[]>(bids);
  const asksRef = useRef<OrderBookItem[]>(asks);
  const spotRef = useRef(spotPrice);
  const rowsRef = useRef<ScanRow[]>([]);
  const impactsRef = useRef<ScanImpact[]>([]);
  const tradesRef = useRef<TradePrint[]>([]);
  const matchRef = useRef<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const whaleThreshold = useMemo(() => {
    const visible = [...bids.slice(0, 20), ...asks.slice(0, 20)];
    const average = visible.reduce((sum, order) => sum + order.quantity, 0) / Math.max(visible.length, 1);
    return average * 2.1;
  }, [asks, bids]);

  useEffect(() => {
    bidsRef.current = bids;
    asksRef.current = asks;
    spotRef.current = spotPrice;
  }, [asks, bids, spotPrice]);

  useEffect(() => {
    if (!lastMatch || matchRef.current === lastMatch.id) {
      return;
    }

    matchRef.current = lastMatch.id;
    tradesRef.current = [
      ...tradesRef.current.slice(-29),
      {
        id: lastMatch.id,
        side: lastMatch.side,
        quantity: lastMatch.quantity,
        price: lastMatch.price,
        age: 0
      }
    ];
    impactsRef.current.push({
      id: lastMatch.id,
      side: lastMatch.side,
      price: lastMatch.price,
      progress: 0
    });
  }, [lastMatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let animationId = 0;
    let width = 0;
    let height = 0;
    let tick = 0;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(360, rect.width);
      height = Math.max(420, rect.height);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const buildRows = (centerX: number, centerY: number) => {
      const upperRoom = Math.max(88, centerY - 118);
      const lowerRoom = Math.max(88, height - centerY - 126);
      const sideCount = Math.max(6, Math.min(18, Math.floor(Math.min(upperRoom, lowerRoom) / 12)));
      const askLevels = asksRef.current.slice(0, sideCount);
      const bidLevels = bidsRef.current.slice(0, sideCount);
      const levels = [...askLevels, ...bidLevels];
      const maxQuantity = Math.max(1, ...levels.map((level) => level.quantity));
      const usableWidth = Math.min(width - 184, 760);
      const rowGap = Math.min(15, Math.max(11, Math.min(upperRoom, lowerRoom) / Math.max(1, sideCount)));

      rowsRef.current = [
        ...askLevels.map((level, index) => {
          const intensity = Math.sqrt(level.quantity / maxQuantity);
          const rowWidth = 42 + intensity * usableWidth;
          return {
            id: level.id,
            side: level.side,
            price: level.price,
            quantity: level.quantity,
            x: centerX - rowWidth / 2,
            y: centerY - 34 - index * rowGap,
            width: rowWidth,
            height: 2.5 + intensity * 7,
            intensity,
            whale: level.quantity >= whaleThreshold
          };
        }),
        ...bidLevels.map((level, index) => {
          const intensity = Math.sqrt(level.quantity / maxQuantity);
          const rowWidth = 42 + intensity * usableWidth;
          return {
            id: level.id,
            side: level.side,
            price: level.price,
            quantity: level.quantity,
            x: centerX - rowWidth / 2,
            y: centerY + 34 + index * rowGap,
            width: rowWidth,
            height: 2.5 + intensity * 7,
            intensity,
            whale: level.quantity >= whaleThreshold
          };
        })
      ];
    };

    const drawBackground = (centerY: number) => {
      context.fillStyle = "#020817";
      context.fillRect(0, 0, width, height);

      const field = context.createLinearGradient(0, 0, 0, height);
      field.addColorStop(0, "rgba(12, 18, 32, 0.98)");
      field.addColorStop(0.5, "rgba(2, 6, 23, 0.98)");
      field.addColorStop(1, "rgba(5, 33, 48, 0.78)");
      context.fillStyle = field;
      context.fillRect(0, 0, width, height);

      const centerGlow = context.createRadialGradient(width / 2, centerY, 10, width / 2, centerY, Math.max(width, height) * 0.55);
      centerGlow.addColorStop(0, "rgba(125, 211, 252, 0.2)");
      centerGlow.addColorStop(0.38, "rgba(14, 165, 233, 0.055)");
      centerGlow.addColorStop(1, "rgba(2, 6, 23, 0)");
      context.fillStyle = centerGlow;
      context.fillRect(0, 0, width, height);

      context.save();
      const plotX = 22;
      const plotY = 54;
      const plotW = width - 44;
      const plotH = height - 128;
      context.fillStyle = "rgba(2, 6, 23, 0.28)";
      context.strokeStyle = "rgba(125, 211, 252, 0.11)";
      context.lineWidth = 1;
      drawRoundRect(context, plotX, plotY, plotW, plotH, 18);
      context.fill();
      context.stroke();
      context.restore();

      context.save();
      context.strokeStyle = "rgba(148, 163, 184, 0.07)";
      context.lineWidth = 1;
      for (let y = centerY - 168; y <= centerY + 168; y += 36) {
        context.beginPath();
        context.moveTo(44, y);
        context.lineTo(width - 44, y);
        context.stroke();
      }
      context.restore();
    };

    const nearestImpactFor = (row: ScanRow) =>
      impactsRef.current.reduce<ScanImpact | null>((best, impact) => {
        if (impact.side !== row.side) {
          return best;
        }
        if (!best) {
          return impact;
        }
        return Math.abs(impact.price - row.price) < Math.abs(best.price - row.price) ? impact : best;
      }, null);

    const drawRow = (row: ScanRow, index: number) => {
      const palette = colorFor(row.side);
      const nearestImpact = nearestImpactFor(row);
      const impactDistance = nearestImpact ? Math.abs(nearestImpact.price - row.price) / Math.max(spotRef.current, 0.000001) : Infinity;
      const isImpacted = Boolean(nearestImpact && impactDistance < 0.0024);
      const impactStrength = isImpacted && nearestImpact ? Math.max(0, 1 - nearestImpact.progress) : 0;
      const whalePulse = row.whale ? 0.12 + Math.sin(tick * 0.045 + index) * 0.06 : 0;
      const alpha = 0.22 + row.intensity * 0.58 + whalePulse + impactStrength * 0.35;
      const rowHeight = row.height + impactStrength * 4;
      const gap = impactStrength * Math.min(row.width * 0.32, 160);
      const leftWidth = Math.max(0, row.width / 2 - gap / 2);
      const rightX = row.x + row.width / 2 + gap / 2;
      const rightWidth = Math.max(0, row.width / 2 - gap / 2);

      context.save();
      context.shadowColor = palette.line;
      context.shadowBlur = row.whale ? 18 : 7;
      context.fillStyle = `${palette.fill}${Math.min(0.95, alpha)})`;

      const underlayWidth = Math.min(width - 112, row.width + 22);
      context.globalAlpha = 0.18 + row.intensity * 0.12;
      context.fillStyle = row.side === "ask" ? "rgba(244, 63, 94, 0.12)" : "rgba(20, 184, 166, 0.12)";
      drawRoundRect(context, width / 2 - underlayWidth / 2, row.y - rowHeight / 2 - 2, underlayWidth, rowHeight + 4, 999);
      context.fill();
      context.globalAlpha = 1;
      context.fillStyle = `${palette.fill}${Math.min(0.95, alpha)})`;

      if (gap > 1) {
        drawRoundRect(context, row.x, row.y - rowHeight / 2, leftWidth, rowHeight, 999);
        context.fill();
        drawRoundRect(context, rightX, row.y - rowHeight / 2, rightWidth, rowHeight, 999);
        context.fill();
      } else {
        drawRoundRect(context, row.x, row.y - rowHeight / 2, row.width, rowHeight, 999);
        context.fill();
      }

      context.strokeStyle = row.whale || impactStrength > 0 ? palette.line : palette.soft;
      context.lineWidth = row.whale ? 1.3 : 0.7;
      if (gap > 1) {
        drawRoundRect(context, row.x, row.y - rowHeight / 2, leftWidth, rowHeight, 999);
        context.stroke();
        drawRoundRect(context, rightX, row.y - rowHeight / 2, rightWidth, rowHeight, 999);
        context.stroke();
      } else {
        drawRoundRect(context, row.x, row.y - rowHeight / 2, row.width, rowHeight, 999);
        context.stroke();
      }

      if (row.whale || impactStrength > 0.15) {
        context.shadowBlur = 0;
        context.fillStyle = palette.label;
        context.font = "10px ui-monospace, SFMono-Regular, Consolas, monospace";
        context.textAlign = row.x + row.width > width * 0.5 ? "left" : "right";
        const labelX = row.x + row.width > width * 0.5 ? Math.min(width - 98, row.x + row.width + 8) : Math.max(96, row.x - 8);
        context.fillText(impactStrength > 0.15 ? "EXECUTED" : "WHALE WALL", labelX, row.y + 3);
      }

      context.restore();
    };

    const drawSpot = (centerY: number) => {
      context.save();
      context.strokeStyle = "rgba(226, 232, 240, 0.72)";
      context.shadowColor = "rgba(125, 211, 252, 0.72)";
      context.shadowBlur = 18;
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(40, centerY);
      context.lineTo(width - 40, centerY);
      context.stroke();
      context.restore();
    };

    const drawAxisLabels = () => {
      context.save();
      context.font = "bold 10px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.textAlign = "left";
      context.fillStyle = "#fda4af";
      context.fillText(`SELL ORDERS ABOVE PRICE ${formatDepth(totals.askDepth)}`, 26, 35);
      context.fillStyle = "#5eead4";
      context.fillText(`BUY ORDERS BELOW PRICE ${formatDepth(totals.bidDepth)}`, 26, height - 90);

      context.textAlign = "right";
      context.fillStyle = "rgba(226, 232, 240, 0.62)";
      context.font = "9px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.fillText("LONGER = MORE MONEY WAITING", width - 26, 35);
      context.fillText("BRIGHTER = STRONGER PRICE WALL", width - 26, height - 90);
      context.restore();
    };

    const drawPriceScale = () => {
      context.save();
      context.font = "9px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.fillStyle = "rgba(203, 213, 225, 0.42)";
      context.textAlign = "right";
      rowsRef.current
        .filter((_, index) => index % 4 === 0)
        .forEach((row) => {
          context.fillText(formatPrice(row.price), width - 24, row.y + 3);
        });
      context.restore();
    };

    const drawTradePressure = () => {
      const x = 22;
      const y = height - 70;
      const panelWidth = width - 44;
      const panelHeight = 48;
      const prints = tradesRef.current;
      const maxQuantity = Math.max(1, ...prints.map((trade) => trade.quantity));

      context.save();
      context.fillStyle = "rgba(2, 6, 23, 0.66)";
      context.strokeStyle = "rgba(125, 211, 252, 0.16)";
      drawRoundRect(context, x, y, panelWidth, panelHeight, 14);
      context.fill();
      context.stroke();

      context.fillStyle = "rgba(226, 232, 240, 0.72)";
      context.font = "9px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.textAlign = "left";
      context.fillText("TRADE PRESSURE", x + 14, y + 18);
      context.fillStyle = "rgba(148, 163, 184, 0.56)";
      context.fillText("taller bars = larger recent trades", x + 14, y + 33);

      const chartX = x + 168;
      const chartY = y + 10;
      const chartW = panelWidth - 188;
      const chartH = panelHeight - 18;
      const barGap = 3;
      const count = Math.max(1, prints.length);
      const barWidth = Math.max(3, Math.min(12, (chartW - barGap * (count - 1)) / 30));

      prints.slice(-30).forEach((trade, index, visiblePrints) => {
        trade.age += 0.004;
        const heightScale = Math.sqrt(trade.quantity / maxQuantity);
        const barHeight = Math.max(4, heightScale * chartH);
        const barX = chartX + index * (barWidth + barGap) + Math.max(0, chartW - visiblePrints.length * (barWidth + barGap));
        const barY = chartY + chartH - barHeight;
        const alpha = Math.max(0.28, 0.94 - trade.age);
        context.fillStyle = trade.side === "ask" ? `rgba(52, 211, 153, ${alpha})` : `rgba(248, 113, 113, ${alpha})`;
        drawRoundRect(context, barX, barY, barWidth, barHeight, 3);
        context.fill();
      });

      tradesRef.current = tradesRef.current.filter((trade) => trade.age < 1.8).slice(-30);
      context.restore();
    };

    const render = () => {
      tick += 1;
      const centerX = width / 2;
      const centerY = height / 2;

      drawBackground(centerY);
      buildRows(centerX, centerY);
      rowsRef.current.forEach(drawRow);
      drawSpot(centerY);
      drawPriceScale();
      drawAxisLabels();
      drawTradePressure();

      impactsRef.current = impactsRef.current
        .map((impact) => ({ ...impact, progress: impact.progress + 0.026 }))
        .filter((impact) => impact.progress < 1);

      animationId = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    render();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [totals.askDepth, totals.bidDepth, whaleThreshold]);

  const updateHoverInfo = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerY = rect.height / 2;
    const hitRow = rowsRef.current.find((row) => {
      const paddedHeight = Math.max(14, row.height + 8);
      return x >= row.x && x <= row.x + row.width && y >= row.y - paddedHeight / 2 && y <= row.y + paddedHeight / 2;
    });

    if (hitRow) {
      const sideLabel = hitRow.side === "ask" ? "Sell orders" : "Buy orders";
      const waitingLabel = hitRow.side === "ask" ? "waiting above market" : "waiting below market";
      setHoverInfo({
        x,
        y,
        tone: hitRow.side,
        title: `${sideLabel} at ${formatPrice(hitRow.price)}`,
        detail: `${formatDepth(hitRow.price * hitRow.quantity)} ${waitingLabel}`
      });
      return;
    }

    if (Math.abs(y - centerY) <= 9 && x >= 40 && x <= rect.width - 40) {
      setHoverInfo({
        x,
        y,
        tone: "spot",
        title: `${formatPrice(spotRef.current)} current price`,
        detail: "The midpoint between the best visible buy and sell orders."
      });
      return;
    }

    setHoverInfo(null);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    updateHoverInfo(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    updateHoverInfo(event.clientX, event.clientY);
  };

  const tooltipTone =
    hoverInfo?.tone === "ask"
      ? "border-pink-300/35 text-pink-50"
      : hoverInfo?.tone === "bid"
        ? "border-emerald-300/35 text-emerald-50"
        : "border-cyan-300/35 text-cyan-50";

  return (
    <div className="scanline cockpit-frame relative h-[64vh] min-h-[500px] overflow-hidden bg-slate-950 md:h-[calc(100vh-242px)] md:min-h-[460px] xl:h-[calc(100vh-226px)]">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        aria-label="DeepPulse liquidity sonar canvas"
        onPointerMove={handlePointerMove}
        onMouseMove={handleMouseMove}
        onPointerLeave={() => setHoverInfo(null)}
        onMouseLeave={() => setHoverInfo(null)}
      />
      <div className="pointer-events-none absolute left-4 top-4 border border-blue-100/20 bg-slate-950 px-3 py-2 font-mono uppercase text-blue-100">
        <p className="text-[10px] tracking-[0.22em] text-blue-100/58">Liquidity Sonar</p>
        <p className="mt-1 text-xs font-black tracking-[0.12em]">{selectedPoolLabel} / DeepBook V3</p>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 border border-cyan-300/20 bg-slate-950 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-100">
        Order book made visual
      </div>
      {hoverInfo ? (
        <div
          className={`pointer-events-none absolute z-20 max-w-[240px] border bg-slate-950 px-3 py-2 font-mono shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${tooltipTone}`}
          style={{
            left: Math.min(Math.max(12, hoverInfo.x + 16), 260),
            top: Math.max(86, hoverInfo.y - 18)
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em]">{hoverInfo.title}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-blue-100/68">{hoverInfo.detail}</p>
        </div>
      ) : null}
    </div>
  );
}
