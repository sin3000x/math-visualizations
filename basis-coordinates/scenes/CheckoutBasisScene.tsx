import { CheckoutIcon } from "../components/CheckoutIcon";
import { FruitBag } from "../components/FruitBag";
import { FruitIcon } from "../components/FruitIcon";
import { MathFormula } from "../components/MathFormula";
import { basis, type Bag } from "../lib/math/bags";
import type { SceneProps } from "../lib/scenes/types";
import "./CheckoutBasisScene.css";

const prices = { apples: 5, bananas: 3 };
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
        {step >= 2 && <div className="probe-prices" data-role="internal-prices">
          {(["apple", "banana"] as const).map((kind, index) => <div className="probe-price" key={kind} data-role={`unit-price-${kind}`}>
            <span className={`fruit ${kind}`}><FruitIcon kind={kind} /></span>
            <MathFormula latex={`${step >= (index === 0 ? 5 : 8) ? Object.values(prices)[index] : "?"}\\,\\text{元/斤}`} />
          </div>)}
        </div>}
        {step >= 3 && <>
        <div className="probe-tray" data-role="checkout-tray" />
        <div className="probe-tray-bag probe-basis-bag" key={second ? "second" : "first"} data-role="probe-bag" data-basis={second ? "2" : "1"}>
          <FruitBag {...basis[second ? 1 : 0]} />
        </div>
      </>}
      </div>
      {(step === 4 || step === 7) && <div className="probe-receipts">
        <div data-role="price-result"><MathFormula latex={`${quote(basis[second ? 1 : 0])}\\,\\text{元}`} /></div>
      </div>}
    </>}
  </section>;
}
