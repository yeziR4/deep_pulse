"use client";

import { ChevronDown, Droplets } from "lucide-react";
import type { PoolKey, PoolOption } from "@/types/radar";

interface PoolSwitcherProps {
  selectedPool: PoolKey;
  poolOptions: PoolOption[];
  onPoolChange: (pool: PoolKey) => void;
}

export function PoolSwitcher({ selectedPool, poolOptions, onPoolChange }: PoolSwitcherProps) {
  const selected = poolOptions.find((pool) => pool.key === selectedPool);

  return (
    <section className="flex items-center justify-between gap-3 border border-cyan-200/20 bg-slate-950 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
          <Droplets className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-100/50">Market Pair</p>
          <p className="truncate font-mono text-sm font-black uppercase tracking-[0.08em] text-white">
            {selected?.label ?? selectedPool.replace("_", " / ")}
          </p>
        </div>
      </div>

      <div className="relative w-44 shrink-0">
        <select
          id="pool-switcher"
          value={selectedPool}
          onChange={(event) => onPoolChange(event.target.value as PoolKey)}
          aria-label="Select DeepBook market pair"
          className="h-11 w-full appearance-none border border-cyan-300/35 bg-slate-900 px-4 pr-10 font-mono text-xs font-black uppercase tracking-[0.1em] text-cyan-50 outline-none transition hover:border-cyan-200 hover:bg-cyan-300/10 focus:border-cyan-100 focus:bg-cyan-300/15"
        >
          {poolOptions.map((pool) => (
            <option key={pool.key} value={pool.key} className="bg-slate-950 text-cyan-50">
              {pool.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-cyan-100" />
      </div>
    </section>
  );
}
