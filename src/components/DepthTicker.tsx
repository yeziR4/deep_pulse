"use client";

import { motion } from "framer-motion";
import { Activity, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { MatchEvent, OrderBookItem } from "@/types/radar";

interface DepthTickerProps {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  spotPrice: number;
  lastMatch: MatchEvent | null;
  totals: {
    bidDepth: number;
    askDepth: number;
    bestBid: number;
    bestAsk: number;
    spread: number;
  };
}

const formatUsd = (value: number) => `$${value.toFixed(5)}`;
const formatQty = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 0 });

function Ladder({ title, side, orders }: { title: string; side: "bid" | "ask"; orders: OrderBookItem[] }) {
  const accent = side === "bid" ? "text-emerald-300" : "text-red-300";
  const inset = side === "bid" ? "shadow-[inset_3px_0_0_rgba(52,211,153,0.55)]" : "shadow-[inset_3px_0_0_rgba(248,113,113,0.55)]";

  return (
    <section className={`bg-slate-950/50 ${inset}`}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className={`font-mono text-xs font-bold uppercase tracking-[0.22em] ${accent}`}>{title}</span>
        {side === "bid" ? <ArrowDownLeft className="size-4 text-emerald-300" /> : <ArrowUpRight className="size-4 text-red-300" />}
      </div>
      <div className="max-h-48 overflow-hidden">
        {orders.slice(0, 12).map((order) => (
          <div key={order.id} className="grid grid-cols-2 gap-2 px-3 py-1.5 font-mono text-xs odd:bg-white/[0.015]">
            <span className={accent}>{formatUsd(order.price)}</span>
            <span className="text-right text-slate-300">{formatQty(order.quantity)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DepthTicker({ bids, asks, spotPrice, lastMatch, totals }: DepthTickerProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="scanline frost-panel flex h-full min-h-0 flex-col gap-4 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">Live DeepBook Feed</p>
          <h2 className="font-mono text-2xl font-black text-white">{formatUsd(spotPrice)}</h2>
        </div>
        <Activity className="size-7 text-cyan-200" />
      </div>

      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
        <div className="bg-emerald-400/5 p-3 shadow-[inset_3px_0_0_rgba(52,211,153,0.55)]">
          <p className="uppercase tracking-[0.18em] text-emerald-300">Bid Depth</p>
          <p className="mt-1 text-lg font-bold text-white">{formatQty(totals.bidDepth)}</p>
        </div>
        <div className="bg-red-400/5 p-3 shadow-[inset_3px_0_0_rgba(248,113,113,0.55)]">
          <p className="uppercase tracking-[0.18em] text-red-300">Ask Depth</p>
          <p className="mt-1 text-lg font-bold text-white">{formatQty(totals.askDepth)}</p>
        </div>
        <div className="bg-slate-900/70 p-3">
          <p className="uppercase tracking-[0.18em] text-slate-400">Best Bid</p>
          <p className="mt-1 text-sm font-bold text-emerald-200">{formatUsd(totals.bestBid)}</p>
        </div>
        <div className="bg-slate-900/70 p-3">
          <p className="uppercase tracking-[0.18em] text-slate-400">Best Ask</p>
          <p className="mt-1 text-sm font-bold text-red-200">{formatUsd(totals.bestAsk)}</p>
        </div>
      </div>

      <div className="bg-cyan-400/5 p-3 font-mono shadow-inner">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Spread</span>
          <span className="text-cyan-200">{formatUsd(totals.spread)}</span>
        </div>
        <div className="mt-3 h-1.5 bg-slate-800">
          <div className="h-full bg-cyan-300 shadow-neon-cyan" style={{ width: `${Math.min(100, totals.spread * 1800)}%` }} />
        </div>
      </div>

      {lastMatch ? (
        <div className="bg-yellow-300/10 p-3 font-mono text-xs shadow-[inset_3px_0_0_rgba(253,224,71,0.6)]">
          <p className="uppercase tracking-[0.22em] text-yellow-200">Latest Match</p>
          <p className="mt-2 text-slate-200">
            {lastMatch.side === "ask" ? "Aggressive Buy" : "Aggressive Sell"} / {formatUsd(lastMatch.price)} /{" "}
            {formatQty(lastMatch.quantity)}
          </p>
        </div>
      ) : null}

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 overflow-hidden">
        <Ladder title="Bid Asteroids" side="bid" orders={bids} />
        <Ladder title="Ask Asteroids" side="ask" orders={asks} />
      </div>
    </motion.aside>
  );
}
