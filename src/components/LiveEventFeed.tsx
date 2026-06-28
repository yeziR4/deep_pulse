"use client";

import { Activity, ArrowDown, ArrowUp, Radio } from "lucide-react";
import type { MatchEvent, PoolKey, WhaleWallAlert } from "@/types/radar";

interface LiveEventFeedProps {
  lastMatch: MatchEvent | null;
  whaleAlert: WhaleWallAlert | null;
  selectedPool: PoolKey;
}

const formatQty = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 0 });
const formatPrice = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: value >= 100 ? 2 : 5 })}`;

export function LiveEventFeed({ lastMatch, whaleAlert, selectedPool }: LiveEventFeedProps) {
  const isBuy = lastMatch?.side === "ask";
  const pool = selectedPool.replace("_", " / ");
  const accent = isBuy ? "text-emerald-300" : "text-pink-300";
  const Icon = isBuy ? ArrowUp : ArrowDown;

  return (
    <section className="frost-panel p-4 font-mono">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-blue-50">
          <Activity className="size-4 text-cyan-200" />
          Latest Trade
        </div>
        <span className="border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100">
          {pool}
        </span>
      </div>

      {lastMatch ? (
        <div className="border border-cyan-300/15 bg-slate-950/70 p-4">
          <div className={`flex items-center gap-2 text-base font-black ${accent}`}>
            <Icon className="size-5" />
            {isBuy ? "Aggressive Buy" : "Aggressive Sell"}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="uppercase tracking-[0.18em] text-blue-100/45">Impact Size</p>
              <p className="mt-1 text-xl font-black text-white">{formatQty(lastMatch.quantity)}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-blue-100/45">Price</p>
              <p className="mt-1 text-xl font-black text-white">{formatPrice(lastMatch.price)}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-blue-100/56">
            {isBuy
              ? "A market buy consumed sell orders above the current price."
              : "A market sell consumed buy orders below the current price."}
          </p>
        </div>
      ) : (
        <div className="border border-cyan-300/15 bg-cyan-300/10 p-4 text-blue-100/75">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Radio className="size-4 text-cyan-200" />
            Waiting for the next match
          </div>
          <p className="mt-3 text-xs">
            {whaleAlert ? "A large price wall is visible while trades stream in." : "The next trade will highlight the row it consumes."}
          </p>
        </div>
      )}
    </section>
  );
}
