import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";

export function RuleScene() {
  return <section className="example-scene" aria-label="长度加倍的数学表达">
    <p data-layout-content>新长度是原长度的两倍</p>
    <div className="example-equation" data-layout-content><MathFormula latex={"2 \\times 2 = 4"} /></div>
  </section>;
}
