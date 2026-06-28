"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ControlPanelProps {
  onAggressiveBuy: () => void;
  onAggressiveSell: () => void;
  dataMode: "live" | "simulation";
  isLoading: boolean;
  error: string | null;
}

export function ControlPanel({
  onAggressiveBuy,
  onAggressiveSell,
  dataMode,
  isLoading,
  error
}: ControlPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="grid items-center gap-3 bg-slate-950 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.24)] lg:grid-cols-[1fr_auto_1fr]"
    >
      <button
        onClick={onAggressiveBuy}
        className="flex items-center justify-center gap-2 bg-emerald-400/14 px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition hover:-translate-y-0.5 hover:bg-emerald-400/20"
      >
        <ArrowUp className="size-4" />
        Aggressive Buy
      </button>

      <div className="bg-slate-900/85 px-5 py-2 text-center font-mono shadow-inner">
        <p className="text-[10px] uppercase tracking-[0.22em] text-blue-100/50">Demo Trade Size</p>
        <p className="text-2xl font-black text-white">10,000</p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-blue-100/45">
          {isLoading ? "Connecting" : dataMode === "live" ? "Live Feed" : error ? "Fallback Armed" : "Demo Mode"}
        </p>
      </div>

      <button
        onClick={onAggressiveSell}
        className="flex items-center justify-center gap-2 bg-pink-500/14 px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-pink-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition hover:-translate-y-0.5 hover:bg-pink-500/20"
      >
        <ArrowDown className="size-4" />
        Aggressive Sell
      </button>
    </motion.section>
  );
}
