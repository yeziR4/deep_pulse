"use client";

import { useState } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { DeepPulseRadar } from "@/components/DeepPulseRadar";
import { Header } from "@/components/Header";
import { LiveEventFeed } from "@/components/LiveEventFeed";
import { MarketIntel } from "@/components/MarketIntel";
import { PoolSwitcher } from "@/components/PoolSwitcher";
import { useDeepBookStream } from "@/hooks/useDeepBookStream";
import type { PoolKey } from "@/types/radar";

export default function Home() {
  const [selectedPool, setSelectedPool] = useState<PoolKey>("SUI_USDC");
  const {
    bids,
    asks,
    spotPrice,
    lastMatch,
    whaleAlert,
    health,
    routeIntel,
    totals,
    dataMode,
    isLoading,
    error,
    poolOptions,
    triggerAggressiveBuy,
    triggerAggressiveSell
  } = useDeepBookStream(selectedPool);
  const selectedPoolLabel = poolOptions.find((pool) => pool.key === selectedPool)?.label ?? selectedPool.replace("_", " / ");

  return (
    <main className="ice-cave flex min-h-screen flex-col text-slate-100">
      <div className="snowfield" />
      <Header />
      <section className="grid flex-1 grid-cols-1 gap-4 p-3 md:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,2.45fr)_minmax(360px,0.86fr)] xl:p-4">
        <div className="grid min-h-0 gap-3">
          <PoolSwitcher selectedPool={selectedPool} poolOptions={poolOptions} onPoolChange={setSelectedPool} />
          <DeepPulseRadar
            bids={bids}
            asks={asks}
            spotPrice={spotPrice}
            lastMatch={lastMatch}
            selectedPoolLabel={selectedPoolLabel}
            totals={totals}
          />
          <ControlPanel
            onAggressiveBuy={triggerAggressiveBuy}
            onAggressiveSell={triggerAggressiveSell}
            dataMode={dataMode}
            isLoading={isLoading}
            error={error}
          />
        </div>
        <div className="grid min-h-0 grid-cols-1 gap-3 md:max-h-[calc(100vh-112px)] md:overflow-y-auto">
          <MarketIntel whaleAlert={whaleAlert} health={health} routeIntel={routeIntel} />
          <LiveEventFeed lastMatch={lastMatch} whaleAlert={whaleAlert} selectedPool={selectedPool} />
        </div>
      </section>
    </main>
  );
}
