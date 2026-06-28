"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

function YetiOperatorMark() {
  return (
    <img
      src="/yeti-operator.png"
      alt="Lofi Yeti operator"
      className="hidden h-16 w-16 shrink-0 border border-cyan-200/30 bg-slate-900 object-cover sm:block"
    />
  );
}

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mt-3 flex items-center justify-between gap-4 border border-cyan-300/20 bg-slate-950 px-4 py-3 shadow-[0_0_0_1px_rgba(8,145,178,0.12),0_16px_40px_rgba(0,0,0,0.32)] xl:mx-4"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <YetiOperatorMark />
          <div>
            <h1 className="yeti-title text-xl font-black text-white md:text-2xl">DeepPulse</h1>
            <p className="text-sm font-semibold text-blue-100/85">Watch DeepBook liquidity move before the market does.</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-100/45">
              Built for CLAY Hackathon / Code Like a Yeti
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-2 border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200 sm:flex">
          <span className="size-2 rounded-full bg-emerald-300 shadow-neon-green" />
          Mainnet
        </div>
        <button className="ice-button flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] transition hover:-translate-y-0.5">
          <Wallet className="size-4" />
          Connect Wallet
        </button>
      </div>
    </motion.header>
  );
}
