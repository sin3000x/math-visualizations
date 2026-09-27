import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import "./PolynomialDualSpaceScene.css";

export function PolynomialDualSpaceScene({ step }: { step: number }) {
  return <section className="polynomial-scene" aria-label="次数不超过二的实多项式空间及其对偶空间">
    <div className="polynomial-space polynomial-vectors" data-role="polynomial-space">
      <div className="polynomial-space-label"><MathFormula latex={"V=P_2(\\mathbb R)"} /></div>
      <div className="polynomial-examples">
        {["1+2x-x^2", "3-2x", "2-x+3x^2"].map(latex => <MathFormula key={latex} latex={latex} />)}
        <MathFormula latex={"\\cdots"} />
      </div>
    </div>
    {step >= 1 && <div className="polynomial-space polynomial-functionals" data-role="polynomial-dual-space">
      <div className="polynomial-space-label"><MathFormula latex={"V^*"} /></div>
      <div className="polynomial-functional-examples">
        <MathFormula latex={"p\\mapsto p(0)"} />
        <MathFormula latex={"p\\mapsto p'(1)"} />
        <MathFormula latex={"\\displaystyle p\\mapsto\\int_0^1 p(x)\\,\\mathrm{d}x"} />
        <MathFormula latex={"\\cdots"} />
      </div>
    </div>}
  </section>;
}
