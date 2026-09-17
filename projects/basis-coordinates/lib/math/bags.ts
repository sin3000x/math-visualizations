export type Bag = Readonly<{ apples: number; bananas: number }>;
export const basis = [{ apples: 1, bananas: 0 }, { apples: 0, bananas: 1 }] as const;
export function scaleBag(bag: Bag, factor: number): Bag {
  return { apples: bag.apples * factor, bananas: bag.bananas * factor };
}
export function combine(a: number, b: number): Bag {
  const left = scaleBag(basis[0], a), right = scaleBag(basis[1], b);
  return { apples: left.apples + right.apples, bananas: left.bananas + right.bananas };
}
export function formatQuantity(value: number): string {
  return Object.is(value, -0) ? "0" : String(value);
}
