import { MathFormula } from "../components/MathFormula";

export function RuleScene() {
  return <section className="example-scene" aria-label="长度加倍的数学表达">
    <p>新长度是原长度的两倍</p>
    <div className="example-equation"><MathFormula latex={"2 \\times 2 = 4"} /></div>
  </section>;
}
