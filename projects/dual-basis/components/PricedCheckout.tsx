import type { CSSProperties, ReactNode } from "react";
import { CheckoutIcon } from "@math-visualizations/scene-kit/CheckoutIcon";
import { UnitPrices } from "@math-visualizations/scene-kit/UnitPrices";
import "./PricedCheckout.css";

export function PricedCheckout({ apples, bananas, color, scale = .6, children }: {
  apples: number; bananas: number; color: string; scale?: number; children?: ReactNode;
}) {
  return <div className="priced-machine priced-checkout" style={{ "--probe-color": color, transform: `scale(${scale})` } as CSSProperties}>
    <CheckoutIcon accent="#eceee8" largeScreen />
    <UnitPrices apples={apples} bananas={bananas} />
    <div className="checkout-tray" data-role="checkout-tray" />
    {children}
  </div>;
}
