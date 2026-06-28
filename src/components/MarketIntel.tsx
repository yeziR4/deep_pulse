"use client";

import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, GitBranch, HelpCircle, ShieldAlert } from "lucide-react";
import type { PoolHealth, RouteIntel, WhaleWallAlert } from "@/types/radar";

interface MarketIntelProps {
  whaleAlert: WhaleWallAlert | null;
  health: PoolHealth;
  routeIntel: RouteIntel;
}

const formatQty = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 0 });
const formatUsd = (value: number) =>
  value >= 1000 ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : `$${value.toFixed(5)}`;
const formatBps = (value: number) => `${value.toFixed(value >= 10 ? 1 : 2)} bps`;
const percent = (value: number) => `${Math.round(value * 100)}%`;

function MetricBar({ label, value }: { label: string; value: string }) {
  return (
    <div className="font-mono">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-blue-100/55">
        <span>{label}</span>
        <span className="text-blue-100">{value}</span>
      </div>
      <div className="mt-1 h-1.5 bg-slate-800">
        <div className="h-full bg-emerald-300" style={{ width: "84%" }} />
      </div>
    </div>
  );
}

export function MarketIntel({ whaleAlert, health, routeIntel }: MarketIntelProps) {
  return (
    <motion.section initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="grid gap-4">
      {whaleAlert ? (
        <motion.div
          key={whaleAlert.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="frost-panel p-4 font-mono"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-pink-100">
              <AlertTriangle className="size-5 text-pink-300" />
              Whale Wall Alert
            </div>
            <span className="border border-white/15 px-3 py-1 text-[10px] text-blue-100/70">View All</span>
          </div>
          <div className="mt-4 border border-pink-300/15 bg-pink-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-200">
              Large {whaleAlert.side === "ask" ? "Sell" : "Buy"} Wall Detected
            </p>
            <p className="mt-1 text-3xl font-black text-pink-300">{formatUsd(whaleAlert.notional)}</p>
            <p className="mt-2 text-sm text-blue-100/80">Price Level {formatUsd(whaleAlert.price)}</p>
            <p className="mt-3 text-xs leading-relaxed text-blue-100/58">
              {whaleAlert.side === "ask"
                ? "This is a large cluster of sellers waiting above the current price."
                : "This is a large cluster of buyers waiting below the current price."}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="frost-panel p-4 font-mono">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-pink-100">
            <ShieldAlert className="size-5 text-pink-300" />
            Whale Wall Alert
          </div>
          <div className="mt-4 border border-cyan-300/15 bg-cyan-300/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">No sudden price wall</p>
            <p className="mt-1 text-2xl font-black text-blue-100">Book stable</p>
            <p className="mt-3 text-xs leading-relaxed text-blue-100/58">No single price level is dominating the visible book.</p>
          </div>
        </div>
      )}

      <div className="frost-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.14em] text-blue-100">
            <BarChart3 className="size-4 text-cyan-200" />
            Pool Health Score
          </div>
          <HelpCircle className="size-4 text-blue-100/60" />
        </div>
        <div className="grid grid-cols-[112px_1fr] items-center gap-4">
          <div
            className="grid size-28 place-items-center border border-cyan-300/20 bg-[conic-gradient(#38bdf8_var(--score),rgba(15,23,42,0.8)_0)] p-3"
            style={{ "--score": `${health.score}%` } as React.CSSProperties}
          >
            <div className="grid size-full place-items-center bg-slate-950/90 font-mono">
              <span className="text-3xl font-black text-blue-100">{health.score}</span>
              <span className="-mt-7 text-xs text-blue-100/60">/100</span>
            </div>
          </div>
          <div className="grid gap-2">
            <MetricBar label="Spread" value={formatBps(health.spreadBps)} />
            <MetricBar label="Depth" value={formatQty(health.topBidDepth + health.topAskDepth)} />
            <MetricBar label="Imbalance" value={percent(health.imbalance)} />
            <MetricBar label="Volatility" value={formatBps(health.volatilityBps)} />
            <MetricBar label="Concentration" value={percent(health.concentration)} />
          </div>
        </div>
      </div>

      <div className="frost-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.14em] text-cyan-100">
            <GitBranch className="size-4" />
            Route Intel
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] text-blue-100/60">Best Pools</span>
        </div>
        <div className="mt-3 grid gap-2">
          {routeIntel.pools.slice(0, 3).map((pool, index) => (
            <div
              key={pool.poolKey}
              className={`grid grid-cols-[34px_1fr_auto_auto] items-center gap-3 border px-3 py-2 font-mono text-xs ${
                index === 0 ? "border-cyan-300/40 bg-cyan-400/15" : "border-cyan-300/15 bg-slate-950/50"
              }`}
            >
              <span className="grid size-7 place-items-center border border-blue-300/20 bg-blue-300/10 text-blue-100">{index + 1}</span>
              <div>
                <p className={pool.poolKey === routeIntel.bestPoolKey ? "font-bold text-cyan-100" : "text-slate-200"}>{pool.label}</p>
                <p className="text-[10px] text-blue-100/45">DeepBook V3</p>
              </div>
              <span className="text-emerald-300">{pool.score}</span>
              <span className="text-blue-100">{formatQty(pool.depth)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
