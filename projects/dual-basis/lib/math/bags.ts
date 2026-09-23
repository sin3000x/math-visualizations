export type Bag = Readonly<{ apples: number; bananas: number }>;
export const basis = [{ apples: 1, bananas: 0 }, { apples: 0, bananas: 1 }] as const;
export const probes = [
  { applePrice: 1, bananaPrice: 0, color: "var(--coral)" },
  { applePrice: 0, bananaPrice: 1, color: "var(--yellow)" },
] as const;
export function evaluate(probe: { applePrice: number; bananaPrice: number }, bag: Bag) {
  return probe.applePrice * bag.apples + probe.bananaPrice * bag.bananas;
}
export const pairings = [
  { bag: 0, probe: 0 }, { bag: 1, probe: 0 },
  { bag: 0, probe: 1 }, { bag: 1, probe: 1 },
] as const;
export function formatQuantity(value: number): string {
  return Object.is(value, -0) ? "0" : String(value);
}
