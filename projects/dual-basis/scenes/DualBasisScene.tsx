import { CheckoutPlacement } from "@math-visualizations/scene-kit/CheckoutPlacement";
import type { CSSProperties } from "react";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { FruitBag } from "../components/FruitBag";
import { UnitPrices } from "@math-visualizations/scene-kit/UnitPrices";
import { CheckoutIcon } from "@math-visualizations/scene-kit/CheckoutIcon";
import { basis, probes, pairings, evaluate } from "../lib/math/bags";
import "./DualBasisScene.css";

export function DualBasisScene({ step }: SceneProps) {
  const active = step >= 2 ? pairings[step - 2] : undefined;
  return <section className="dual-basis-scene" aria-label="水果袋基与收银台对偶基的取值关系">
    <div className="bag-space space-outline"><MathFormula latex="V" /></div>
    {basis.map((bag, index) => <div className="basis-bag" data-basis={index + 1} key={index} style={{ top: 205 + index * 260 }}>
      <div className="bag-name"><MathFormula latex={`e_${index + 1}`} /></div>
      <div><FruitBag {...bag} /></div>
    </div>)}
    {step >= 1 && <div className="dual-space space-outline"><MathFormula latex={"V^*"} /></div>}
    {step >= 1 && probes.map((probe, index) => {
      const measured = active?.probe === index;
      return <div key={index} className={`probe ${measured ? "active" : ""}`} style={{ top: 170 + index * 260, "--probe-color": probe.color } as CSSProperties} data-role="checkout" data-probe={index + 1}>
        <div className="probe-name"><MathFormula latex={`f_${index + 1}`} /></div>
        <div className="priced-machine">
          <CheckoutIcon accent="#eceee8" largeScreen />
          <UnitPrices apples={probe.applePrice} bananas={probe.bananaPrice} />
          <div className="checkout-tray" data-role="checkout-tray" />
          {measured && <CheckoutPlacement key={`bag-${step}`} className="checkout-tray-bag" source={`[data-basis="${active.bag + 1}"] .fruit-bag`} data-role="tray-bag">
            <FruitBag {...basis[active.bag]} />
          </CheckoutPlacement>}
        </div>
        {measured && <div key={step} className="checkout-reading" data-role="reading" data-value={evaluate(probe, basis[active.bag])}><MathFormula latex={String(evaluate(probe, basis[active.bag]))} /></div>}
      </div>;
    })}
    <div className="pairing-results" data-role="pairing-results">{pairings.map(({ bag, probe }, index) => step >= index + 2 && <div key={index} className={step === index + 2 ? "new-result" : "past-result"} style={{ color: probes[probe].color }} data-role="pairing" data-bag={bag + 1} data-probe={probe + 1} data-value={evaluate(probes[probe], basis[bag])}>
      <MathFormula latex={`f_${probe + 1}(e_${bag + 1})=${evaluate(probes[probe], basis[bag])}`} />
    </div>)}</div>
  </section>;
}
