import type { CSSProperties } from "react";
import { CheckoutIcon } from "./CheckoutIcon";
import type { BagVector } from "../lib/model/bagSpace";
import { FruitBag } from "../scenes/FruitBag";
import "./LoadedCheckout.css";

export function LoadedCheckout({ bag, kind = "f", bagStyle }: { bag: BagVector; kind?: "f" | "g"; bagStyle?: CSSProperties }) {
  return <div className="definition-loaded-checkout">
    <div className={`loaded-checkout-machine checkout-${kind}`} role="img" aria-label={kind === "f" ? "青色收银台" : "黄色收银台"}>
      <CheckoutIcon accent={kind === "f" ? "#62d2c3" : "#f4c95d"} />
    </div>
    <span className="definition-tray" />
    <div className="loaded-checkout-bag" style={bagStyle} data-role="checkout-moving-bag"><FruitBag {...bag} compact /></div>
  </div>;
}
