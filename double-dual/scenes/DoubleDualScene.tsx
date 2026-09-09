import { LoadedCheckout } from "../components/LoadedCheckout";
import { FruitBag } from "../components/FruitBag";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "../components/MathFormula";
import type { SceneProps } from "../lib/scenes/types";

const bag = { apples: 2, bananas: 1 };
const prices = { apples: 5, bananas: 6 };
const reading = bag.apples * prices.apples + bag.bananas * prices.bananas;
export function DoubleDualScene({ step }: SceneProps) {
  return <section className="double-dual-scene" aria-label="水果袋是被测量的对象，收银台是线性测量；什么可以测量收银台？">
    <div className="space-row">
      <div className="space bag-space" data-role="vector-space">
        <div className="space-symbol"><MathFormula latex="V" /></div>
        <div className="space-element"><FruitBag {...bag} /></div>
      </div>
      <div className="space checkout-space" data-role="dual-space">
        <div className="space-symbol"><MathFormula latex={"V^*"} /></div>
        <div className="space-element"><CheckoutIcon accent="#62d2c3" /></div>
      </div>
      <div className={`space mystery-space reveal ${step >= 2 ? "shown" : ""}`} aria-hidden={step < 2} data-role="double-dual-space">
        <div className="space-symbol"><MathFormula latex={"V^{**}"} /></div>
        <div className={`space-element answer ${step === 3 ? "resolved" : ""}`} aria-label={step === 3 ? "这袋水果定义了对收银台的测量" : "什么可以测量收银台"}>
          <span className="question" aria-hidden={step === 3}>?</span>
          <div className="answer-bag" aria-hidden={step !== 3}><FruitBag {...bag} /></div>
        </div>
      </div>
    </div>
    {step >= 1 && <div className={`measurement ${step === 1 ? "loading" : ""}`} data-role="measurement-example" aria-label={step === 2 ? "这个收银台通过什么得到什么价格？" : "把这袋水果放到收银台托盘上，得到价格16"}>
      <div className="loaded-example"><LoadedCheckout bag={bag} mystery={step === 2} /></div>
      <div className="equals"><MathFormula latex="=" /></div>
      <div className={`reading ${step === 2 ? "unknown-reading" : ""}`} data-role="measurement-reading" aria-label={step === 2 ? "未知价格" : "价格16"}>
        <span className="price-value" aria-hidden={step === 2}><MathFormula latex={String(reading)} /></span>
        <span className="price-question" aria-hidden={step !== 2}>?</span>
      </div>
    </div>}
  </section>;
}
