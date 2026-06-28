export interface OrderBookItem {
  id: string;
  price: number;
  quantity: number;
  side: "bid" | "ask";
}

export interface RadarParticle {
  id: string;
  price: number;
  quantity: number;
  side: "bid" | "ask";
  radius: number;
  angle: number;
  orbitSpeed: number;
  targetDistance: number;
  currentDistance: number;
  opacity: number;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  side: "bid" | "ask";
}

export type PoolKey = "SUI_USDC" | "DEEP_USDC" | "WAL_USDC" | "BETH_USDC";

export interface PoolOption {
  key: PoolKey;
  label: string;
  base: string;
  quote: string;
}

export interface WhaleWallAlert {
  id: string;
  side: "bid" | "ask";
  price: number;
  quantity: number;
  notional: number;
  dominance: number;
  createdAt: number;
  severity: "watch" | "high" | "critical";
}

export interface PoolHealth {
  score: number;
  spreadBps: number;
  imbalance: number;
  volatilityBps: number;
  concentration: number;
  topBidDepth: number;
  topAskDepth: number;
}

export interface RouteIntelPool {
  poolKey: PoolKey;
  label: string;
  depth: number;
  spreadBps: number;
  score: number;
  mode: "live" | "simulation" | "error";
}

export interface RouteIntel {
  bestPoolKey: PoolKey;
  bestLabel: string;
  summary: string;
  updatedAt: number;
  pools: RouteIntelPool[];
}

export interface MatchEvent {
  id: string;
  side: "bid" | "ask";
  price: number;
  quantity: number;
  timestamp: number;
}

export interface RadarMathRequest {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  spotPrice: number;
}

export interface RadarMathResponse {
  particles: RadarParticle[];
}
