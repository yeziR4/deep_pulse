"use client";

import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { DeepBookClient, mainnetCoins, mainnetPools } from "@mysten/deepbook-v3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  MatchEvent,
  OrderBookItem,
  PoolHealth,
  PoolKey,
  PoolOption,
  RadarMathResponse,
  RadarParticle,
  RouteIntel,
  RouteIntelPool,
  WhaleWallAlert
} from "@/types/radar";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";
const INITIAL_SPOT_BY_POOL: Record<PoolKey, number> = {
  SUI_USDC: 3.1842,
  DEEP_USDC: 0.0824,
  WAL_USDC: 0.418,
  BETH_USDC: 3450.62
};
const LEVEL_COUNT = 36;
const LIVE_TICKS = 32;
const ROUTE_SCAN_TICKS = 18;

export const DEEPBOOK_POOL_OPTIONS: PoolOption[] = [
  { key: "SUI_USDC", label: "SUI / USDC", base: "SUI", quote: "USDC" },
  { key: "DEEP_USDC", label: "DEEP / USDC", base: "DEEP", quote: "USDC" },
  { key: "WAL_USDC", label: "WAL / USDC", base: "WAL", quote: "USDC" },
  { key: "BETH_USDC", label: "BETH / USDC", base: "BETH", quote: "USDC" }
];

type DataMode = "live" | "simulation";

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const createSeededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};
const seededBetween = (rng: () => number, min: number, max: number) => min + rng() * (max - min);
const idFor = (poolKey: PoolKey, side: "bid" | "ask", index: number) =>
  `${poolKey.toLowerCase()}-${side}-${index.toString().padStart(2, "0")}`;

const makeBook = (poolKey: PoolKey, spotPrice: number, rng = Math.random): { bids: OrderBookItem[]; asks: OrderBookItem[] } => {
  const bids = Array.from({ length: LEVEL_COUNT }, (_, index) => {
    const depth = index + 1;
    return {
      id: idFor(poolKey, "bid", index),
      side: "bid" as const,
      price: Number((spotPrice * (1 - depth * 0.00118 - seededBetween(rng, 0, 0.0006))).toFixed(6)),
      quantity: Number(seededBetween(rng, 280, 36000).toFixed(2))
    };
  });

  const asks = Array.from({ length: LEVEL_COUNT }, (_, index) => {
    const depth = index + 1;
    return {
      id: idFor(poolKey, "ask", index),
      side: "ask" as const,
      price: Number((spotPrice * (1 + depth * 0.00118 + seededBetween(rng, 0, 0.0006))).toFixed(6)),
      quantity: Number(seededBetween(rng, 280, 36000).toFixed(2))
    };
  });

  return { bids, asks };
};

const makeInitialBook = (poolKey: PoolKey) =>
  makeBook(poolKey, INITIAL_SPOT_BY_POOL[poolKey], createSeededRandom(20260626 + poolKey.length));

const mutateBook = (orders: OrderBookItem[], spotPrice: number, side: "bid" | "ask") =>
  orders.map((order, index) => {
    const drift = side === "bid" ? -1 : 1;
    const depth = index + 1;
    const price = spotPrice * (1 + drift * (depth * 0.00116 + randomBetween(0, 0.00085)));
    const quantity = Math.max(90, order.quantity * randomBetween(0.82, 1.18) + randomBetween(-420, 420));

    return {
      ...order,
      price: Number(price.toFixed(6)),
      quantity: Number(quantity.toFixed(2))
    };
  });

const toLiveOrders = (
  poolKey: PoolKey,
  side: "bid" | "ask",
  prices: number[],
  quantities: number[]
): OrderBookItem[] =>
  prices
    .map((price, index) => ({
      id: `live-${idFor(poolKey, side, index)}-${price}`,
      price,
      quantity: quantities[index] ?? 0,
      side
    }))
    .filter((order) => Number.isFinite(order.price) && order.price > 0 && order.quantity > 0);

const topDepth = (orders: OrderBookItem[], levels = 8) => orders.slice(0, levels).reduce((sum, order) => sum + order.quantity, 0);

const calculateSpreadBps = (bids: OrderBookItem[], asks: OrderBookItem[]) => {
  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  if (!bestBid || !bestAsk) {
    return 9999;
  }
  return ((bestAsk - bestBid) / ((bestAsk + bestBid) / 2)) * 10000;
};

const calculateHealth = (bids: OrderBookItem[], asks: OrderBookItem[], spotHistory: number[]): PoolHealth => {
  const bidDepth = topDepth(bids);
  const askDepth = topDepth(asks);
  const totalDepth = bidDepth + askDepth;
  const spreadBps = Math.max(0, calculateSpreadBps(bids, asks));
  const imbalance = totalDepth > 0 ? (bidDepth - askDepth) / totalDepth : 0;
  const combinedTop = [...bids.slice(0, 5), ...asks.slice(0, 5)].reduce((sum, order) => sum + order.quantity, 0);
  const combinedDepth = [...bids.slice(0, 16), ...asks.slice(0, 16)].reduce((sum, order) => sum + order.quantity, 0);
  const concentration = combinedDepth > 0 ? combinedTop / combinedDepth : 0;
  const firstPrice = spotHistory[0] ?? 0;
  const lastPrice = spotHistory[spotHistory.length - 1] ?? firstPrice;
  const volatilityBps = firstPrice > 0 ? Math.abs((lastPrice - firstPrice) / firstPrice) * 10000 : 0;
  const spreadScore = Math.max(0, 34 - Math.min(34, spreadBps * 1.25));
  const balanceScore = Math.max(0, 24 - Math.abs(imbalance) * 24);
  const volatilityScore = Math.max(0, 18 - Math.min(18, volatilityBps * 0.4));
  const concentrationScore = Math.max(0, 24 - Math.max(0, concentration - 0.34) * 70);

  return {
    score: Math.round(Math.max(0, Math.min(100, spreadScore + balanceScore + volatilityScore + concentrationScore))),
    spreadBps,
    imbalance,
    volatilityBps,
    concentration,
    topBidDepth: bidDepth,
    topAskDepth: askDepth
  };
};

const summarizeRoutePool = (poolKey: PoolKey, bids: OrderBookItem[], asks: OrderBookItem[], mode: RouteIntelPool["mode"]): RouteIntelPool => {
  const option = DEEPBOOK_POOL_OPTIONS.find((pool) => pool.key === poolKey);
  const depth = topDepth(bids, 10) + topDepth(asks, 10);
  const spreadBps = Math.max(0, calculateSpreadBps(bids, asks));
  const depthScore = Math.min(70, Math.log10(depth + 1) * 12);
  const spreadScore = Math.max(0, 30 - Math.min(30, spreadBps * 1.35));

  return {
    poolKey,
    label: option?.label ?? poolKey,
    depth,
    spreadBps,
    score: Math.round(depthScore + spreadScore),
    mode
  };
};

const makeRouteIntel = (pools: RouteIntelPool[]): RouteIntel => {
  const sorted = [...pools].sort((a, b) => b.score - a.score);
  const best = sorted[0] ?? {
    poolKey: "SUI_USDC" as const,
    label: "SUI / USDC",
    depth: 0,
    spreadBps: 0,
    score: 0,
    mode: "simulation" as const
  };

  return {
    bestPoolKey: best.poolKey,
    bestLabel: best.label,
    summary: `${best.label} currently offers the strongest visible depth-to-spread profile.`,
    updatedAt: Date.now(),
    pools: sorted
  };
};

const createDeepBookClient = () => {
  const suiClient = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" });
  return new DeepBookClient({
    client: suiClient,
    network: "mainnet",
    address: ZERO_ADDRESS,
    coins: mainnetCoins,
    pools: mainnetPools
  });
};

export function useDeepBookStream(selectedPool: PoolKey = "SUI_USDC") {
  const initialBook = useMemo(() => makeInitialBook(selectedPool), [selectedPool]);
  const [spotPrice, setSpotPrice] = useState(INITIAL_SPOT_BY_POOL[selectedPool]);
  const [bids, setBids] = useState<OrderBookItem[]>(() => initialBook.bids);
  const [asks, setAsks] = useState<OrderBookItem[]>(() => initialBook.asks);
  const [particles, setParticles] = useState<RadarParticle[]>([]);
  const [lastMatch, setLastMatch] = useState<MatchEvent | null>(null);
  const [whaleAlert, setWhaleAlert] = useState<WhaleWallAlert | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>("simulation");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeIntel, setRouteIntel] = useState<RouteIntel>(() =>
    makeRouteIntel(
      DEEPBOOK_POOL_OPTIONS.map((pool) => {
        const book = makeInitialBook(pool.key);
        return summarizeRoutePool(pool.key, book.bids, book.asks, "simulation");
      })
    )
  );
  const workerRef = useRef<Worker | null>(null);
  const deepBookClientRef = useRef<DeepBookClient | null>(null);
  const selectedPoolRef = useRef(selectedPool);
  const previousWallRef = useRef<Map<string, number>>(new Map());
  const spotHistoryRef = useRef<number[]>([INITIAL_SPOT_BY_POOL[selectedPool]]);

  useEffect(() => {
    selectedPoolRef.current = selectedPool;
    const nextBook = makeInitialBook(selectedPool);
    setSpotPrice(INITIAL_SPOT_BY_POOL[selectedPool]);
    setBids(nextBook.bids);
    setAsks(nextBook.asks);
    setParticles([]);
    setLastMatch(null);
    setWhaleAlert(null);
    setIsLoading(true);
    setError(null);
    previousWallRef.current = new Map();
    spotHistoryRef.current = [INITIAL_SPOT_BY_POOL[selectedPool]];
  }, [selectedPool]);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/radarMath.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<RadarMathResponse>) => {
      setParticles((previous) => {
        const prior = new Map(previous.map((particle) => [particle.id, particle]));
        return event.data.particles.map((particle) => {
          const existing = prior.get(particle.id);
          return existing
            ? {
                ...particle,
                angle: existing.angle,
                currentDistance: existing.currentDistance,
                opacity: Math.max(existing.opacity, particle.opacity)
              }
            : particle;
        });
      });
    };

    return () => worker.terminate();
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({ bids, asks, spotPrice });
  }, [bids, asks, spotPrice]);

  const triggerMatch = useCallback(
    (side: "bid" | "ask") => {
      const book = side === "bid" ? bids : asks;
      const level = book[Math.floor(randomBetween(0, Math.min(12, book.length)))];
      if (!level) {
        return;
      }

      setLastMatch({
        id: `${side}-match-${Date.now()}`,
        side,
        price: level.price,
        quantity: Number(randomBetween(Math.min(10, level.quantity), Math.max(12, level.quantity * 0.42)).toFixed(2)),
        timestamp: Date.now()
      });
    },
    [asks, bids]
  );

  useEffect(() => {
    let isMounted = true;
    let failureCount = 0;

    const fetchLiveOrderbook = async () => {
      try {
        deepBookClientRef.current ??= createDeepBookClient();
        const level2Data = await deepBookClientRef.current.getLevel2TicksFromMid(selectedPool, LIVE_TICKS);
        if (!isMounted || selectedPoolRef.current !== selectedPool) {
          return;
        }

        const liveBids = toLiveOrders(selectedPool, "bid", level2Data.bid_prices, level2Data.bid_quantities);
        const liveAsks = toLiveOrders(selectedPool, "ask", level2Data.ask_prices, level2Data.ask_quantities);

        if (!liveBids.length || !liveAsks.length) {
          throw new Error("DeepBook returned an empty L2 book for this pool");
        }

        setBids(liveBids);
        setAsks(liveAsks);
        const nextSpot = Number(((liveBids[0].price + liveAsks[0].price) / 2).toFixed(9));
        spotHistoryRef.current = [...spotHistoryRef.current.slice(-23), nextSpot];
        setSpotPrice(nextSpot);
        setDataMode("live");
        setIsLoading(false);
        setError(null);
        failureCount = 0;
      } catch (caught) {
        if (!isMounted) {
          return;
        }

        failureCount += 1;
        const message = caught instanceof Error ? caught.message : "Failed to fetch DeepBook mainnet orderbook";
        setDataMode("simulation");
        setIsLoading(false);
        setError(`Live DeepBook RPC unavailable, running fallback simulation. ${message}`);
      }
    };

    fetchLiveOrderbook();
    const poll = window.setInterval(fetchLiveOrderbook, 2000);

    return () => {
      isMounted = false;
      window.clearInterval(poll);
      failureCount = 0;
    };
  }, [selectedPool]);

  useEffect(() => {
    let isMounted = true;

    const scanRoutes = async () => {
      const results = await Promise.all(
        DEEPBOOK_POOL_OPTIONS.map(async (pool) => {
          try {
            deepBookClientRef.current ??= createDeepBookClient();
            const level2Data = await deepBookClientRef.current.getLevel2TicksFromMid(pool.key, ROUTE_SCAN_TICKS);
            const liveBids = toLiveOrders(pool.key, "bid", level2Data.bid_prices, level2Data.bid_quantities);
            const liveAsks = toLiveOrders(pool.key, "ask", level2Data.ask_prices, level2Data.ask_quantities);
            if (!liveBids.length || !liveAsks.length) {
              throw new Error("empty book");
            }
            return summarizeRoutePool(pool.key, liveBids, liveAsks, "live");
          } catch {
            const book = makeInitialBook(pool.key);
            return summarizeRoutePool(pool.key, book.bids, book.asks, "simulation");
          }
        })
      );

      if (isMounted) {
        setRouteIntel(makeRouteIntel(results));
      }
    };

    scanRoutes();
    const interval = window.setInterval(scanRoutes, 10000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (dataMode === "live") {
        triggerMatch(Math.random() > 0.5 ? "bid" : "ask");
        return;
      }

      setSpotPrice((current) => {
        const next = Number((current * randomBetween(0.9972, 1.0028)).toFixed(6));
        spotHistoryRef.current = [...spotHistoryRef.current.slice(-23), next];
        setBids((currentBids) => mutateBook(currentBids, next, "bid"));
        setAsks((currentAsks) => mutateBook(currentAsks, next, "ask"));
        window.setTimeout(() => triggerMatch(Math.random() > 0.5 ? "bid" : "ask"), 120);
        return next;
      });
    }, 1500);

    const firstShot = window.setTimeout(() => triggerMatch("ask"), 550);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(firstShot);
    };
  }, [dataMode, triggerMatch]);

  useEffect(() => {
    const candidates = [...bids.slice(0, 10), ...asks.slice(0, 10)];
    const totalVisibleDepth = candidates.reduce((sum, order) => sum + order.quantity, 0);
    if (!totalVisibleDepth) {
      return;
    }

    let alert: WhaleWallAlert | null = null;
    const nextSnapshot = new Map<string, number>();
    const averageDepth = totalVisibleDepth / candidates.length;

    for (const order of candidates) {
      nextSnapshot.set(order.id, order.quantity);
      const previousQuantity = previousWallRef.current.get(order.id) ?? 0;
      const dominance = order.quantity / totalVisibleDepth;
      const suddenGrowth = previousQuantity > 0 ? order.quantity / previousQuantity : 1;
      const isWall = order.quantity > averageDepth * 2.4 && dominance > 0.12;
      const isSudden = previousQuantity === 0 || suddenGrowth > 1.35;

      if (isWall && isSudden) {
        const notional = order.price * order.quantity;
        alert = {
          id: `${order.id}-${Date.now()}`,
          side: order.side,
          price: order.price,
          quantity: order.quantity,
          notional,
          dominance,
          createdAt: Date.now(),
          severity: dominance > 0.28 ? "critical" : dominance > 0.18 ? "high" : "watch"
        };
        break;
      }
    }

    previousWallRef.current = nextSnapshot;
    if (alert) {
      setWhaleAlert(alert);
    }
  }, [asks, bids]);

  const totals = useMemo(() => {
    const bidDepth = bids.reduce((sum, order) => sum + order.quantity, 0);
    const askDepth = asks.reduce((sum, order) => sum + order.quantity, 0);
    const bestBid = bids[0]?.price ?? spotPrice;
    const bestAsk = asks[0]?.price ?? spotPrice;
    return {
      bidDepth,
      askDepth,
      bestBid,
      bestAsk,
      spread: Math.max(0, bestAsk - bestBid)
    };
  }, [asks, bids, spotPrice]);

  const health = useMemo(() => calculateHealth(bids, asks, spotHistoryRef.current), [asks, bids]);

  return {
    spotPrice,
    bids,
    asks,
    particles,
    lastMatch,
    whaleAlert,
    health,
    routeIntel,
    totals,
    dataMode,
    isLoading,
    error,
    selectedPool,
    poolOptions: DEEPBOOK_POOL_OPTIONS,
    triggerAggressiveBuy: () => triggerMatch("ask"),
    triggerAggressiveSell: () => triggerMatch("bid")
  };
}
