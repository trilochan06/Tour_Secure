// backend/src/utils/safety.ts
export function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

/** Combine crime/infra/sentiment into a 0..100 safety score */
export function calculateSafety(
  crime: number = 50,
  infra: number = 50,
  sentiment: number = 0
) {
  const sSent = ((sentiment + 1) / 2) * 100; // -1..+1 → 0..100
  const raw = 100 - 0.3 * crime + 0.2 * infra + 0.5 * sSent;
  return Math.round(clamp(raw));
}
