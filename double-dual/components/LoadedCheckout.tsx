import type { CSSProperties } from "react";
import { CheckoutIcon } from "./CheckoutIcon";
type BagVector = Readonly<{ apples: number; bananas: number }>;
import { FruitBag } from "./FruitBag";
import "./LoadedCheckout.css";

export function LoadedCheckout({ bag, kind = "f", bagStyle, mystery = false }: { bag: BagVector; kind?: "f" | "g"; bagStyle?: CSSProperties; mystery?: boolean }) {
  return <div className={`definition-loaded-checkout ${mystery ? "is-mystery" : ""}`}>
    <div className={`loaded-checkout-machine checkout-${kind}`} role="img" aria-label={kind === "f" ? "青色收银台" : "黄色收银台"}>
      <CheckoutIcon accent={kind === "f" ? "#62d2c3" : "#f4c95d"} />
    </div>
    <span className="definition-tray" />
    <div className="loaded-checkout-bag" style={bagStyle} data-role="checkout-moving-bag"><FruitBag {...bag} compact /></div>
    <div className="tray-question" aria-hidden={!mystery}>?</div>
  </div>;
}
