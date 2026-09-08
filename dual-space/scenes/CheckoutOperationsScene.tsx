import type { ReactNode } from "react";
import { LoadedCheckout } from "../components/LoadedCheckout";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "../components/MathFormula";
import { checkouts, getQuote } from "../lib/model/market";
import { FruitBag } from "./FruitBag";
import "./CheckoutOperationsScene.css";

function Checkout({ kind }: { kind: "f" | "g" }) {
  return <div className={`equation-checkout checkout-${kind}`} role="img" aria-label={kind === "f" ? "青色收银台" : "黄色收银台"}>
    <CheckoutIcon accent={kind === "f" ? "#62d2c3" : "#f4c95d"} />
  </div>;
}

const fixedBag = { id: "definition-bag", apples: 2, bananas: 1 };

function FixedBag() {
  return <div className="checkout-equation-bag"><FruitBag apples={fixedBag.apples} bananas={fixedBag.bananas} compact /></div>;
}

function DefinitionSymbol() {
  return <span className="checkout-definition-symbol"><span>定义为</span><MathFormula latex={"\\coloneqq"} /></span>;
}

function Receipt({ amount, total = false }: { amount: number; total?: boolean }) {
  return <div className={total ? "definition-receipt total-receipt" : "definition-receipt"}>
    <span>{total ? "合计" : "报价"}</span>
    <MathFormula latex={`${Number(amount.toFixed(2))}\\,\\text{元}`} />
  </div>;
}

function Transaction({ kind }: { kind: "f" | "g" }) {
  const checkout = checkouts[kind === "f" ? 0 : 1];
  return <div className="definition-transaction" aria-label={`${kind === "f" ? "青色" : "黄色"}收银台为同一袋报价`}>
    <LoadedCheckout bag={fixedBag} kind={kind} />
    <Receipt amount={getQuote(fixedBag, checkout)} />
  </div>;
}

function DefinitionRow({ scalar, visible, showResult }: { scalar: boolean; visible: boolean; showResult: boolean }) {
  const node = (id: string, x: number, content: ReactNode, y?: number) => <div key={id} data-motion-id={id} className="checkout-motion-node" style={{ left: x, top: y }}>{content}</div>;
  const symbol = (id: string, x: number, latex: string) => node(id, x, <MathFormula latex={latex} />);
  const bracket = (id: string, x: number, side: "(" | ")") => node(id, x, <span className="checkout-parenthesis"><MathFormula latex={side} /></span>);
  const checkout = (id: string, x: number, kind: "f" | "g") => node(id, x, <Checkout kind={kind} />);
  const bag = (id: string, x: number) => node(id, x, <FixedBag />);
  return <div className="checkout-motion-row" data-operation={scalar ? "scalar" : "addition"} style={{ visibility: visible ? "visible" : "hidden" }} aria-hidden={!visible} aria-label={scalar ? "数乘定义：先按原收银台报价，再乘以零点八" : "加法定义：同一袋分别报价，再相加"}>
    {scalar ? <>
      {bracket("lhs-open", 105, "(")}{symbol("lhs-scalar", 165, "0.8")}{checkout("lhs-f", 275, "f")}{bracket("lhs-close", 355, ")")}{bag("lhs-bag", 445)}
      {node("definition", 555, <DefinitionSymbol />)}
      <div className="checkout-result" data-visible={showResult} aria-hidden={!showResult}>
        {node("rhs-transaction", 840, <Transaction kind="f" />, 148)}
        {node("rhs-scalar", 690, <MathFormula latex={"0.8~\\times"} />, 269)}
        {node("rhs-equals", 975, <MathFormula latex="=" />, 269)}
        {node("rhs-total", 1110, <Receipt amount={0.8 * getQuote(fixedBag, checkouts[0])} total />, 269)}
      </div>
    </> : <>
      {bracket("lhs-open", 25, "(")}{checkout("lhs-f", 105, "f")}{symbol("lhs-plus", 190, "+")}{checkout("lhs-g", 275, "g")}{bracket("lhs-close", 355, ")")}{bag("lhs-bag", 445)}
      {node("definition", 555, <DefinitionSymbol />)}
      <div className="checkout-result" data-visible={showResult} aria-hidden={!showResult}>
        {node("rhs-f-transaction", 730, <Transaction kind="f" />, 148)}
        {node("rhs-g-transaction", 990, <Transaction kind="g" />, 148)}
        {node("rhs-plus", 860, <MathFormula latex="+" />, 269)}
        {node("rhs-equals", 1110, <MathFormula latex="=" />, 269)}
        {node("rhs-total", 1230, <Receipt amount={getQuote(fixedBag, checkouts[0]) + getQuote(fixedBag, checkouts[1])} total />, 269)}
      </div>
    </>}
  </div>;
}

export function CheckoutOperationsScene({ step }: { step: number }) {
  return <section className="axiom-canvas definition-only checkout-operations" aria-label="收银台的加法与数乘">
    <div className="checkout-equations">
      <DefinitionRow scalar={false} visible showResult={step >= 1} />
      <DefinitionRow scalar visible={step >= 2} showResult={step >= 3} />
    </div>
  </section>;
}
