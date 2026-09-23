import { CheckoutPlacement } from "@math-visualizations/scene-kit/CheckoutPlacement";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { FruitBag } from "../components/FruitBag";
import { UnitPrices } from "../components/UnitPrices";
import { basisPrices as prices } from "../lib/math/prices";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { basis, type Bag } from "../lib/math/bags";
import type { SceneProps } from "@math-visualizations/scene-kit/types";
import "./CheckoutBasisScene.css";

const quote = (bag: Bag) => bag.apples * prices.apples + bag.bananas * prices.bananas;
const u = { apples: 2, bananas: 1 }, v = { apples: 1, bananas: 2 };
function Transaction({ bag }: { bag: Bag }) {
  return <div className="probe-transaction">
    <div className="probe-mini-assembly">
      <CheckoutIcon accent="#62d2c3" />
      <div className="probe-tray" data-role="checkout-tray" />
      <div className="probe-tray-bag" data-role="tray-bag"><FruitBag {...bag} /></div>
    </div>
    <div className="probe-small-result"><MathFormula latex={`${quote(bag)}\\,\\text{元}`} /></div>
  </div>;
}
export function CheckoutBasisScene({ step }: SceneProps) {
  const linearity = step === 1;
  const second = step >= 6;
  return <section className={`checkout-basis probe-step-${step}`} data-role="checkout-basis" aria-label="用两个基袋测出收银台内置的单价">
    {linearity ? <div className="probe-linearity">
      <div className="probe-output-equation addition-row">
        <Transaction bag={{ apples: 3, bananas: 3 }} /><MathFormula latex="=" />
        <Transaction bag={u} /><MathFormula latex="+" /><Transaction bag={v} />
      </div>
      <div className="probe-output-equation scaling-row">
        <Transaction bag={{ apples: 4, bananas: 2 }} /><MathFormula latex="=" />
        <MathFormula latex={"2\\times"} /><Transaction bag={u} />
      </div>
    </div> : <>
      <div className="probe-machine"><CheckoutIcon accent="#62d2c3" largeScreen />
        {step >= 2 && <UnitPrices apples={step >= 5 ? prices.apples : null} bananas={step >= 8 ? prices.bananas : null} />}
        {step >= 3 && <>
        <div className="probe-tray" data-role="checkout-tray" />
        <CheckoutPlacement className="probe-tray-bag probe-basis-bag" key={second ? "second" : "first"} data-role="probe-bag" data-basis={second ? "2" : "1"}>
          <FruitBag {...basis[second ? 1 : 0]} />
        </CheckoutPlacement>
      </>}
      </div>
      {(step === 4 || step === 7) && <div className="probe-receipts">
        <div data-role="price-result"><MathFormula latex={`${quote(basis[second ? 1 : 0])}\\,\\text{元}`} /></div>
      </div>}
    </>}
  </section>;
}
