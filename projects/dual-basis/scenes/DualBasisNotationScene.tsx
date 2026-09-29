import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import "./DualBasisNotationScene.css";

export function DualBasisNotationScene({ step }: { step: number }) {
  return <section className="notation-scene" data-mapping={step >= 5} aria-label="对偶基记号与基确定的同构">
    <div data-layout-content className="notation-row notation-vectors" data-role="notation-vectors">
      <MathFormula latex="V" />
      <MathFormula latex={"(v_1,\\ldots,v_n)"} />
    </div>
    {step >= 1 && <div data-layout-content className="notation-row notation-functionals" data-role="notation-functionals">
      <MathFormula latex={"V^*"} />
      <span className="notation-symbols" key={step >= 3 ? "star" : "f"}>
        <MathFormula latex={step >= 3 ? "(v_1^*,\\ldots,v_n^*)" : "(f_1,\\ldots,f_n)"} />
      </span>
    </div>}
    {step === 2 && <div data-layout-content className="notation-condition" data-role="notation-condition">
      <MathFormula latex={"f_i(v_j)=\\begin{cases}1,&i=j,\\\\0,&i\\ne j.\\end{cases}"} />
    </div>}
    {step === 4 && <div data-layout-content className="notation-alternative" data-role="notation-alternative">
      <MathFormula latex={"(v^1,\\ldots,v^n)"} />
    </div>}
    {step >= 5 && <div data-layout-content className="notation-basis-arrow" data-role="notation-basis-map">
      <MathFormula latex={"\\longmapsto"} />
    </div>}
    {step >= 6 && <div data-layout-content className="notation-isomorphism" data-role="notation-isomorphism">
      <MathFormula latex={"V\\overset{\\sim}{\\longrightarrow}V^*"} />
    </div>}
    {step >= 7 && <div data-layout-content className="notation-vector-map" data-role="notation-vector-map">
      <span className="notation-expansion"><MathFormula latex="v=" /><MathFormula latex={"\\sum_{i=1}^n a_i v_i"} /></span>
      <MathFormula latex={"\\longmapsto"} />
      <span><MathFormula latex={"v^*=\\sum_{i=1}^n a_i v_i^*"} /></span>
    </div>}
    {step >= 8 && <div data-layout-content className="notation-vector-map notation-new-basis-map" data-role="notation-new-basis-map">
      <span className="notation-expansion"><MathFormula latex={"\\phantom{v}="} /><MathFormula latex={"\\sum_{i=1}^n b_i w_i"} /></span>
      <MathFormula latex={"\\longmapsto"} />
      <span><MathFormula latex={"\\widetilde{v}^{*}=\\sum_{i=1}^n b_i w_i^*"} /></span>
    </div>}
  </section>;
}
