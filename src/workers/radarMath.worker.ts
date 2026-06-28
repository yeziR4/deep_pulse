import type { OrderBookItem, RadarMathRequest, RadarMathResponse, RadarParticle } from "@/types/radar";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const particleFromOrder = (order: OrderBookItem, spotPrice: number, index: number, total: number): RadarParticle => {
  const deviation = Math.abs((order.price - spotPrice) / spotPrice);
  const clampedDeviation = clamp(deviation, 0, 0.05);
  const targetDistance = 96 + (clampedDeviation / 0.05) * 210 + (index % 6) * 9;
  const radius = Math.log10(order.quantity + 1) * 4 + 2;
  const laneRatio = total <= 1 ? 0.5 : index / (total - 1);
  const hemisphereStart = order.side === "bid" ? 0 : Math.PI;
  const angle = hemisphereStart + laneRatio * Math.PI;
  const orbitSpeed = (order.side === "bid" ? 1 : -1) * (0.0014 + (index % 7) * 0.00022);

  return {
    id: order.id,
    price: order.price,
    quantity: order.quantity,
    side: order.side,
    radius,
    angle,
    orbitSpeed,
    targetDistance,
    currentDistance: targetDistance,
    opacity: 0.58 + Math.min(0.36, radius / 24)
  };
};

self.onmessage = (event: MessageEvent<RadarMathRequest>) => {
  const { bids, asks, spotPrice } = event.data;
  const bidParticles = bids.map((order, index) => particleFromOrder(order, spotPrice, index, bids.length));
  const askParticles = asks.map((order, index) => particleFromOrder(order, spotPrice, index, asks.length));
  const payload: RadarMathResponse = { particles: [...bidParticles, ...askParticles] };

  self.postMessage(payload);
};

export {};
