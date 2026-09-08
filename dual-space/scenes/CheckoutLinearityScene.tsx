import { useImperativeHandle, useState, type CSSProperties, type Ref } from "react";
import { LoadedCheckout } from "../components/LoadedCheckout";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "../components/MathFormula";
import { addBags, scaleBag, type BagVector } from "../lib/model/bagSpace";
import { checkouts, getQuote } from "../lib/model/market";
import { FruitBag } from "./FruitBag";
import "./CheckoutLinearityScene.css";

const checkout = checkouts[0];
const u = { apples: 2, bananas: 1 };
const v = { apples: 1, bananas: 2 };
const quote = (bag: BagVector) => getQuote({ ...bag, id: "linearity-example" }, checkout);

function Bag({ bag }: { bag: BagVector }) {
  return <div className="linearity-input-bag"><FruitBag {...bag} compact /></div>;
}

function Receipt({ amount }: { amount: number }) {
  return <div className="linearity-receipt"><MathFormula latex={`${amount}\\,\\text{元}`} /></div>;
}

function Transaction({ bag, x, children, phase, combine = false }: { bag: BagVector; x: number; children: React.ReactNode; phase: number; combine?: boolean }) {
  const loaded = phase >= (combine ? 2 : 4);
  const bagVisible = !combine || phase >= 1;
  return <div className={`linearity-transaction ${combine ? "linearity-combined" : "linearity-separate"}`} style={{ "--transaction-x": `${x}px` } as CSSProperties}>
    {combine && <div className="linearity-input" style={{ opacity: phase === 0 ? 1 : 0, visibility: phase === 0 ? "visible" : "hidden" }}>{children}</div>}
    <div className="linearity-machine"><LoadedCheckout bag={bag} bagStyle={{
      opacity: bagVisible ? 1 : 0,
      transform: loaded ? "translate(0, 0) scale(1)" : "translate(-55.5px, -315.5px) scale(2.833333)",
      transition: "transform .9s ease-in-out, opacity .25s ease",
    }} /></div>
    <div style={{ opacity: phase >= (combine ? 3 : 5) ? 1 : 0 }} className="linearity-receipt-reveal"><Receipt amount={quote(bag)} /></div>
  </div>;
}

export function CheckoutLinearityScene({ step, animationRef }: { step: number; animationRef: Ref<{ navigate: (direction: 1 | -1) => boolean }> }) {
  const [phase, setPhase] = useState(0);
  useImperativeHandle(animationRef, () => ({ navigate(direction) {
    if (step === 0 || (direction === 1 && phase === 6) || (direction === -1 && phase === 0)) return false;
    setPhase(current => Math.max(0, Math.min(6, current + direction)));
    return true;
  } }), [phase, step]);
  const scalar = step === 2;
  return <section className="axiom-canvas checkout-linearity" aria-label="一个收银台的线性性质">
    {step === 0 ? <div className="linearity-intro" aria-label="收银台把一袋水果映射为一个实数">
      <div className="linearity-intro-counter"><CheckoutIcon accent={checkout.accent} /></div>
      <div className="linearity-intro-mapping">
        <Bag bag={u} />
        <span className="linearity-intro-arrow"><MathFormula latex={"\\longmapsto"} /></span>
        <span className="linearity-intro-number"><MathFormula latex={`${quote(u)}`} /></span>
      </div>
    </div> :
      <div key={step} className="linearity-comparison" data-phase={phase} data-operation={scalar ? "scalar" : "addition"}
        aria-label={scalar ? "把一袋水果缩放后再结账，等于先结账再缩放" : "把两袋水果加起来再结账，等于分别结账再相加"}>
        <Transaction bag={scalar ? scaleBag(2, u) : addBags(u, v)} x={330} phase={phase} combine>
          {scalar ? <><MathFormula latex={"2\\times"} /><Bag bag={u} /></> : <><Bag bag={u} /><MathFormula latex="+" /><Bag bag={v} /></>}
        </Transaction>
        <span className="linearity-equals"><MathFormula latex="=" /></span>
        {scalar ? <>
          <Transaction bag={u} x={1040} phase={phase}><Bag bag={u} /></Transaction>
          <span className="linearity-output-scalar"><MathFormula latex={"2\\times"} /></span>
        </> : <>
          <Transaction bag={u} x={910} phase={phase}><Bag bag={u} /></Transaction>
          <span className="linearity-output-plus"><MathFormula latex="+" /></span>
          <Transaction bag={v} x={1230} phase={phase}><Bag bag={v} /></Transaction>
        </>}
      </div>}
  </section>;
}
