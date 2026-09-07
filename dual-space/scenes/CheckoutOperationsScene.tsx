import type { ReactNode } from "react";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "../components/MathFormula";
import { FruitBag } from "./FruitBag";
import "./CheckoutOperationsScene.css";

function Checkout({ kind }: { kind: "f" | "g" }) {
  return <div className={`equation-checkout checkout-${kind}`} role="img" aria-label={kind === "f" ? "青色收银台" : "黄色收银台"}>
    <CheckoutIcon accent={kind === "f" ? "#62d2c3" : "#f4c95d"} />
  </div>;
}

function FixedBag() {
  return <div className="checkout-equation-bag"><FruitBag apples={2} bananas={1} compact /></div>;
}

function DefinitionSymbol() {
  return <span className="checkout-definition-symbol"><span>定义为</span><MathFormula latex={"\\coloneqq"} /></span>;
}

function DefinitionRow({ scalar, visible, showResult }: { scalar: boolean; visible: boolean; showResult: boolean }) {
  const node = (id: string, x: number, content: ReactNode) => <div key={id} data-motion-id={id} className="checkout-motion-node" style={{ left: x }}>{content}</div>;
  const symbol = (id: string, x: number, latex: string) => node(id, x, <MathFormula latex={latex} />);
  const bracket = (id: string, x: number, side: "(" | ")") => node(id, x, <span className="checkout-parenthesis"><MathFormula latex={side} /></span>);
  const checkout = (id: string, x: number, kind: "f" | "g") => node(id, x, <Checkout kind={kind} />);
  const bag = (id: string, x: number) => node(id, x, <FixedBag />);
  return <div className="checkout-motion-row" data-operation={scalar ? "scalar" : "addition"} style={{ visibility: visible ? "visible" : "hidden" }} aria-hidden={!visible} aria-label={scalar ? "数乘定义：先按原收银台报价，再乘以零点八" : "加法定义：同一袋分别报价，再相加"}>
    {scalar ? <>
      {bracket("lhs-open", 225, "(")}{symbol("lhs-scalar", 285, "0.8")}{checkout("lhs-f", 395, "f")}{bracket("lhs-close", 475, ")")}{bag("lhs-bag", 565)}
      {node("definition", 675, <DefinitionSymbol />)}
      <div className="checkout-result" data-visible={showResult} aria-hidden={!showResult}>
        {symbol("rhs-scalar", 770, "0.8")}{checkout("rhs-f", 885, "f")}
        {bracket("rhs-open", 965, "(")}{bag("rhs-bag", 1055)}{bracket("rhs-close", 1145, ")")}
      </div>
    </> : <>
      {bracket("lhs-open", 25, "(")}{checkout("lhs-f", 105, "f")}{symbol("lhs-plus", 190, "+")}{checkout("lhs-g", 275, "g")}{bracket("lhs-close", 355, ")")}{bag("lhs-bag", 445)}
      {node("definition", 555, <DefinitionSymbol />)}
      <div className="checkout-result" data-visible={showResult} aria-hidden={!showResult}>
        {checkout("rhs-f", 660, "f")}{bracket("rhs-f-open", 735, "(")}{bag("rhs-f-bag", 820)}{bracket("rhs-f-close", 905, ")")}
        {symbol("rhs-plus", 945, "+")}
        {checkout("rhs-g", 1030, "g")}{bracket("rhs-g-open", 1105, "(")}{bag("rhs-g-bag", 1190)}{bracket("rhs-g-close", 1275, ")")}
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
