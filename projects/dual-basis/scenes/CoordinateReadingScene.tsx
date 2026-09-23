import type { CSSProperties } from "react";
import { CheckoutPlacement } from "@math-visualizations/scene-kit/CheckoutPlacement";
import { CheckoutIcon } from "@math-visualizations/scene-kit/CheckoutIcon";
import { UnitPrices } from "@math-visualizations/scene-kit/UnitPrices";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { FruitBag } from "../components/FruitBag";
import { evaluate, probes } from "../lib/math/bags";
import "./DualBasisScene.css";
import "./CoordinateReadingScene.css";

const bag = { apples: 3, bananas: 2 } as const;

export function CoordinateReadingScene({ step }: SceneProps) {
  return <section className="dual-basis-scene coordinate-reading-scene" aria-label="对偶基分别读出苹果和香蕉的斤数">
    <div className="basis-bag general-source">
      <FruitBag {...bag} />
    </div>
    {probes.map((probe, index) => {
      const measured = step > index;
      const value = evaluate(probe, bag);
      return <div key={index} className={`probe ${step === index + 1 ? "active" : ""}`} style={{ "--probe-color": probe.color } as CSSProperties} data-role="checkout" data-probe={index + 1}>
        <div className="probe-name"><MathFormula latex={`f_${index + 1}`} /></div>
        <div className="priced-machine">
          <CheckoutIcon accent="#eceee8" largeScreen />
          <UnitPrices apples={probe.applePrice} bananas={probe.bananaPrice} />
          <div className="checkout-tray" data-role="checkout-tray" />
          {measured && <CheckoutPlacement className="checkout-tray-bag" source=".general-source .fruit-bag" data-role="tray-bag">
            <FruitBag {...bag} />
          </CheckoutPlacement>}
        </div>
        {measured && <div className="checkout-reading" data-role="reading" data-value={value}><MathFormula latex={String(value)} /></div>}
      </div>;
    })}
  </section>;
}
