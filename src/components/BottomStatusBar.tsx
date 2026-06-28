"use client";

import { Database, Radio, Waves } from "lucide-react";

interface BottomStatusBarProps {
  dataMode: "live" | "simulation";
  totals: {
    bidDepth: number;
    askDepth: number;
  };
}

const formatMetric = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

export function BottomStatusBar({ dataMode, totals }: BottomStatusBarProps) {
  return (
    <section className="frost-panel mx-3 mb-3 grid gap-3 px-4 py-3 font-mono text-xs md:grid-cols-4 xl:mx-4">
      <div className="flex items-center gap-3">
        <Radio className="size-5 text-cyan-200" />
        <div>
          <p className="uppercase tracking-[0.18em] text-blue-100/50">Yeti Operator</p>
          <p className="text-emerald-200">System Online</p>
        </div>
      </div>
      <div>
        <p className="uppercase tracking-[0.18em] text-blue-100/50">24h Volume</p>
        <p className="text-lg font-black text-white">$18.7M</p>
      </div>
      <div>
        <p className="uppercase tracking-[0.18em] text-blue-100/50">Visible Depth</p>
        <p className="text-lg font-black text-white">{formatMetric(totals.bidDepth + totals.askDepth)}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="uppercase tracking-[0.18em] text-blue-100/50">Built On</p>
          <p className="text-lg font-black text-cyan-100">Sui + DeepBook V3</p>
        </div>
        {dataMode === "live" ? <Waves className="size-6 text-emerald-300" /> : <Database className="size-6 text-yellow-300" />}
      </div>
    </section>
  );
}
