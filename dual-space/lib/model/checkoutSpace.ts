import type { BagVector } from "./bagSpace.ts";

export type CheckoutRule = Readonly<{ appleRate: number; bananaRate: number }>;

export function addCheckouts(left: CheckoutRule, right: CheckoutRule): CheckoutRule {
  return { appleRate: left.appleRate + right.appleRate, bananaRate: left.bananaRate + right.bananaRate };
}

export function scaleCheckout(scalar: number, rule: CheckoutRule): CheckoutRule {
  return { appleRate: scalar * rule.appleRate, bananaRate: scalar * rule.bananaRate };
}

export function quote(rule: CheckoutRule, bag: BagVector): number {
  return rule.appleRate * bag.apples + rule.bananaRate * bag.bananas;
}
