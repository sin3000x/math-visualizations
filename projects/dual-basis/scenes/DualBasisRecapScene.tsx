import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import "./DualBasisRecapScene.css";

export function DualBasisRecapScene({ step }: { step: number }) {
  return <section className="recap-scene" aria-label="有限维空间的基与对偶基">
    {step >= 2 && <div className="recap-finite" data-recap-content>
      <span>有限维</span><MathFormula latex={"\\dim V=n<\\infty"} />
    </div>}
    <div className="recap-space recap-primal" data-recap-content>
      <MathFormula latex="V" />
      <MathFormula latex={"(v_1,\\ldots,v_n)"} />
    </div>
    {step >= 1 && <>
      <div className="recap-space recap-dual" data-recap-content>
        <MathFormula latex="V^*" />
        <MathFormula latex={"(v_1^*,\\ldots,v_n^*)"} />
      </div>
      <div className="recap-correspondence" data-recap-content><MathFormula latex={"\\longmapsto"} /></div>
      <div className="recap-pairing" data-recap-content><MathFormula latex={"\\textcolor{#ba91ef}{v_i^*}(\\textcolor{#62d2c3}{v_j})=\\begin{cases}1,&i=j,\\\\0,&i\\ne j.\\end{cases}"} /></div>
    </>}
  </section>;
}
