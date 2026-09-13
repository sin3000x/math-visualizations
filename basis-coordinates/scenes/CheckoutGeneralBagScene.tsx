import { CheckoutIcon } from "../components/CheckoutIcon";
import { FruitBag } from "../components/FruitBag";
import { FruitIcon } from "../components/FruitIcon";
import { MathFormula } from "../components/MathFormula";
import type { SceneProps } from "../lib/scenes/types";
import "./CheckoutBasisScene.css";
import "./CheckoutGeneralBagScene.css";

export function CheckoutGeneralBagScene({ step }: SceneProps) {
  return <section className={`checkout-basis general-bag-scene ${step >= 2 ? "general-raised" : ""}`} data-role="checkout-general-bag" aria-label="由单价计算任意水果袋的价格">
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
      <div className="coordinate-value"><MathFormula latex={"\\begin{bmatrix}a\\\\b\\end{bmatrix}"} /></div>
    </div>}
    {step >= 4 && <>
      <div className="matrix-equals"><MathFormula latex="=" /></div>
      <div className="general-result-copy" data-role="result-copy"><MathFormula latex="5a+3b" /></div>
    </>}
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
      <div className="row-value"><MathFormula latex={"\\begin{bmatrix}5&3\\end{bmatrix}"} /></div>
    </div>}
  </section>;
}
