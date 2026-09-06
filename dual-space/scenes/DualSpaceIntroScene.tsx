import { useState } from "react";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { bags, checkouts, getQuote } from "../lib/model/market";
import { FruitBag } from "./FruitBag";
import { getIntroFlags } from "./content";

function reveal(visible: boolean, className: string) {
  return visible ? `${className} reveal visible` : `${className} reveal`;
}

export function DualSpaceIntroScene({ step }: { step: number }) {
  const [bagId, setBagId] = useState(bags[0].id);
  const [checkoutId, setCheckoutId] = useState(checkouts[0].id);
  const bag = bags.find((candidate) => candidate.id === bagId) ?? bags[0];
  const checkout = checkouts.find((candidate) => candidate.id === checkoutId) ?? checkouts[0];
  const flags = getIntroFlags(step);

  const exampleBags = bags.slice(0, 3);
  const exampleCheckouts = checkouts.slice(0, 3);

  return (
    <section className={`intro-canvas step-${step}`} aria-label="袋子与收银台的直观关系">
      <div className={reveal(flags.showBagsWorld, "world bags-world")} aria-hidden={!flags.showBagsWorld}>
        <div className="world-heading"><span className="world-dot" />所有袋子</div>
        <div className="bag-collection">
          {exampleBags.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              className={candidate.id === bag.id ? "object-card bag-card selected" : "object-card bag-card"}
              onClick={() => setBagId(candidate.id)}
              aria-pressed={candidate.id === bag.id}
              tabIndex={flags.showBagsWorld ? 0 : -1}
            >
              <FruitBag apples={candidate.apples} bananas={candidate.bananas} compact />
            </button>
          ))}
          <div className="more-objects" aria-label="还有更多袋子">…</div>
        </div>
        <div className={reveal(flags.showSpaceNames, "world-name")} aria-hidden={!flags.showSpaceNames}>线性空间</div>
      </div>
      <div className="transaction-stage" aria-live="polite">
        <div className="chosen-object chosen-bag reveal visible">
          <FruitBag apples={bag.apples} bananas={bag.bananas} compact />
        </div>
        <div className={reveal(flags.showQuote, "motion-line")} aria-hidden={!flags.showQuote}><i /><i /><i /></div>
        <div className={reveal(flags.showCheckout, "chosen-object chosen-checkout")} aria-hidden={!flags.showCheckout}>
          <CheckoutIcon accent={checkout.accent} />
        </div>
        <div className={reveal(flags.showQuote, "receipt-card")} aria-hidden={!flags.showQuote}>
          <span>合计</span>
          <strong>¥ {getQuote(bag, checkout).toFixed(1)}</strong>
        </div>
      </div>
      <div className={reveal(flags.showCheckoutsWorld, "world checkouts-world")} aria-hidden={!flags.showCheckoutsWorld}>
        <div className="world-heading"><span className="world-dot" />所有收银台</div>
        <div className="checkout-collection">
          {exampleCheckouts.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              className={candidate.id === checkout.id ? "object-card checkout-card selected" : "object-card checkout-card"}
              onClick={() => setCheckoutId(candidate.id)}
              aria-pressed={candidate.id === checkout.id}
              tabIndex={flags.showCheckoutsWorld ? 0 : -1}
            >
              <CheckoutIcon accent={candidate.accent} />
              <span>{candidate.name}</span>
            </button>
          ))}
          <div className="more-objects" aria-label="还有更多收银台">…</div>
        </div>
        <div className={reveal(flags.showSpaceNames, "world-name")} aria-hidden={!flags.showSpaceNames}>对偶空间</div>
      </div>
    </section>
  );
}
