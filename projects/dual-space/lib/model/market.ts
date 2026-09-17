export type Bag = Readonly<{ id: string; apples: number; bananas: number }>;
export type Checkout = Readonly<{ id: string; name: string; accent: string; appleRate: number; bananaRate: number }>;

export const bags: readonly Bag[] = [
  { id: "bag-a", apples: 0.5, bananas: 1.2 }, { id: "bag-b", apples: 1.0, bananas: 0.6 },
  { id: "bag-c", apples: 1.8, bananas: 1.5 }, { id: "bag-d", apples: 2.3, bananas: 0.8 },
  { id: "bag-e", apples: 0.7, bananas: 2.1 }, { id: "bag-f", apples: 1.4, bananas: 1.9 },
];

export const checkouts: readonly Checkout[] = [
  { id: "checkout-a", name: "收银台 A", accent: "#62d2c3", appleRate: 6, bananaRate: 4 },
  { id: "checkout-b", name: "收银台 B", accent: "#f4c95d", appleRate: 3, bananaRate: 6 },
  { id: "checkout-c", name: "收银台 C", accent: "#8d7acb", appleRate: 6, bananaRate: 6 },
  { id: "checkout-d", name: "收银台 D", accent: "#ed6a5a", appleRate: 9, bananaRate: 2 },
];

export function getQuote(bag: Bag, checkout: Checkout): number {
  return bag.apples * checkout.appleRate + bag.bananas * checkout.bananaRate;
}
