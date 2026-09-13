import { useLayoutEffect, useRef } from "react";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { FruitBag } from "../components/FruitBag";
import { FruitIcon } from "../components/FruitIcon";
import { MathFormula } from "../components/MathFormula";
import type { SceneProps } from "../lib/scenes/types";
import "./CheckoutBasisScene.css";
import "./CheckoutGeneralBagScene.css";

export function CheckoutGeneralBagScene({ step }: SceneProps) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const scene = root.current!;
    const scale = scene.getBoundingClientRect().width / 1440;
    const animations: Animation[] = [];
    const ghost = scene.querySelector<HTMLElement>(step === 3 ? ".bag-copy-ghost" : step === 5 ? ".machine-copy-ghost" : ".not-present");
    const target = scene.querySelector<HTMLElement>(step === 3 ? ".equation-column" : ".equation-row");
    if (ghost && target) {
      const from = ghost.getBoundingClientRect(), to = target.getBoundingClientRect();
      const dx = (to.x + to.width / 2 - from.x - from.width / 2) / scale;
      const dy = (to.y + to.height / 2 - from.y - from.height / 2) / scale;
      const transform = `translate(${dx}px, ${dy}px) scale(${step === 5 ? .65 : 1})`;
      animations.push(ghost.animate([
        { transform: "none", opacity: 1, offset: 0 },
        { transform, opacity: 1, offset: .65 },
        { transform, opacity: 0, offset: 1 },
      ], { duration: step === 5 ? 1600 : 1500, easing: "ease-in-out" }));
    }
    if (step === 4) {
      const result = scene.querySelector<HTMLElement>(".equation-result")!;
      const from = scene.querySelector('[data-role="general-price"]')!.getBoundingClientRect();
      const to = result.getBoundingClientRect();
      animations.push(result.animate([
        { transform: `translate(${(from.x - to.x) / scale}px, ${(from.y - to.y) / scale}px)` },
        { transform: "none" },
      ], { duration: 1100, easing: "ease-in-out" }));
    }
    return () => animations.forEach(animation => animation.cancel());
  }, [step]);
  return <section ref={root} className={`checkout-basis general-bag-scene ${step >= 2 ? "general-raised" : ""}`} data-role="checkout-general-bag" aria-label="由单价计算任意水果袋的价格">
    <div className="general-original">
      <div className="probe-machine">
        <CheckoutIcon accent="#62d2c3" largeScreen />
        <div className="probe-prices" data-role="internal-prices">
          {(["apple", "banana"] as const).map((kind, index) => <div className="probe-price" key={kind}>
            <span className={`fruit ${kind}`}><FruitIcon kind={kind} /></span>
            <MathFormula latex={`${index === 0 ? 5 : 3}\\,\\text{元/斤}`} />
          </div>)}
        </div>
        <div className="probe-tray" data-role="checkout-tray" />
        <div className="probe-tray-bag probe-basis-bag" data-role="general-bag">
          <FruitBag apples="a" bananas="b" />
        </div>
      </div>
      {step >= 1 && <div className="probe-receipts">
        <div data-role="general-price"><MathFormula latex={"5a+3b\\,\\text{元}"} /></div>
      </div>}
    </div>
    {step >= 3 && <div className="coordinate-copy" data-role="coordinate-copy">
      <div className="bag-copy-ghost" aria-hidden="true"><FruitBag apples="a" bananas="b" /></div>
    </div>}
    {step >= 5 && <div className="checkout-copy" data-role="checkout-copy">
      <div className="machine-copy-ghost" aria-hidden="true">
        <CheckoutIcon accent="#62d2c3" largeScreen />
        <div className="probe-prices">
          {(["apple", "banana"] as const).map((kind, index) => <div className="probe-price" key={kind}>
            <span className={`fruit ${kind}`}><FruitIcon kind={kind} /></span>
            <MathFormula latex={`${index === 0 ? 5 : 3}\\,\\text{元/斤}`} />
          </div>)}
        </div>
      </div>
    </div>}
    <div className="general-equation" aria-label="单价行向量乘以坐标列向量得到价格">
      <span className={`equation-row ${step >= 5 ? "is-shown" : ""}`}><MathFormula latex={"\\begin{bmatrix}5&3\\end{bmatrix}"} /></span>
      <span className={`equation-column ${step >= 3 ? "is-shown" : ""}`}><MathFormula latex={"\\begin{bmatrix}a\\\\b\\end{bmatrix}"} /></span>
      <span className={`equation-equals ${step >= 4 ? "is-shown" : ""}`}><MathFormula latex="=" /></span>
      <span className={`equation-result ${step >= 4 ? "is-shown" : ""}`} data-role={step >= 4 ? "result-copy" : undefined}><MathFormula latex="5a+3b" /></span>
    </div>
  </section>;
}
