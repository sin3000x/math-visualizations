export type BagVector = Readonly<{
  apples: number;
  bananas: number;
}>;

export const ZERO_BAG: BagVector = { apples: 0, bananas: 0 };

export function addBags(left: BagVector, right: BagVector): BagVector {
  return {
    apples: left.apples + right.apples,
    bananas: left.bananas + right.bananas,
  };
}

export function scaleBag(scalar: number, bag: BagVector): BagVector {
  return {
    apples: scalar * bag.apples,
    bananas: scalar * bag.bananas,
  };
}

export function bagsEqual(left: BagVector, right: BagVector, tolerance = 1e-10): boolean {
  return Math.abs(left.apples - right.apples) <= tolerance
    && Math.abs(left.bananas - right.bananas) <= tolerance;
}
