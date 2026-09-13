import type { Bag } from "./bags";
export const changedBasis = [{ apples: 1, bananas: 1 }, { apples: 0, bananas: 1 }] as const;
export const priceOf = (bag: Bag) => 5 * bag.apples + 3 * bag.bananas;
export const changedCoordinates = (bag: Bag) => [bag.apples, bag.bananas - bag.apples] as const;
export const changedRow = changedBasis.map(priceOf);
export function reconstructChanged([a, b]: readonly [number, number]): Bag {
  return { apples: a, bananas: a + b };
}
