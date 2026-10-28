import { JuicerIcon } from "@math-visualizations/scene-kit/JuicerIcon";
import { FruitBag } from "@math-visualizations/scene-kit/FruitBag";
import { Juice } from "../components/Juice";
import { Formula } from "../components/Notation";
import { apply, MATRIX, MATRIX_R, MATRIX_S, type Bag, type Juice as Quantities } from "../lib/math/map";
import "./JuiceMapScene.css";

const examples: readonly Quantities[] = [[2, 0, 1], [1, 4, 2], [3, 2, 5]];
const sharedBag: Bag = [2, 1];
// Each machine is a linear map on the same two input quantities.
const machines = [
  { color: "#f4c95d", label: "T", output: apply(MATRIX, sharedBag) },
  { color: "#ed6a5a", label: "S", output: apply(MATRIX_S, sharedBag) },
  { color: "#73a7ef", label: "R", output: apply(MATRIX_R, sharedBag) },
];
export function JuiceMapScene({ step }: { step: number }) {
  const comparing = step >= 2;
  return <section className={`lesson juice-intro ${comparing ? "comparing" : "collections"}`} data-step={step} aria-label="同一袋水果经过不同线性映射得到不同果汁组合">
    <div className="space input-space" data-layout-content><Formula latex="V" /></div>
    {step >= 1 && <div className="space output-space" data-layout-content><Formula latex="W" /></div>}
    <div className="intro-selected-bag" data-layout-content data-role="shared-input"><FruitBag apples={sharedBag[0]} bananas={sharedBag[1]} /></div>
    {!comparing && <>
      <div className="intro-example-bag bag-a" data-layout-content><FruitBag apples={1} bananas={3} /></div>
      <div className="intro-example-bag bag-b" data-layout-content><FruitBag apples={3} bananas={0} /></div>
    </>}
    {step >= 1 && !comparing && examples.map((values, i) => <div className={`intro-output output-${i}`} key={i} data-layout-content><Juice values={values} /></div>)}
    {comparing && machines.slice(0, step - 1).map((machine, i) => <div className="intro-mapping" key={machine.label} data-role="mapping" data-map={machine.label}>
      <svg className="intro-flow" viewBox="0 0 1440 810" aria-hidden="true" style={{ color: machine.color }}>
        <path pathLength="1" d={`M410 375 C495 375 505 ${215 + i * 165} 608 ${215 + i * 165}`} />
        <path pathLength="1" d={`M755 ${215 + i * 165} H910 m-16 -10 16 10 -16 10`} />
      </svg>
      <div className={`intro-machine machine-${i}`} style={{ color: machine.color }} data-layout-content>
        <Formula latex={machine.label} /><JuicerIcon />
      </div>
      <div className={`intro-output mapped-output output-${i}`} data-layout-content><Juice values={machine.output} /></div>
    </div>)}
  </section>;
}
