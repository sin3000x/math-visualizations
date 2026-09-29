import { useLayoutEffect, useRef } from "react";
import { animateLagrangeScaling } from "../lib/animation/lagrangeScaling";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { SvgFormula } from "@math-visualizations/scene-kit/SvgFormula";
import { lagrangeNodes, lagrangeValue, examplePolynomial } from "../lib/math/lagrange";
import { PolynomialSpaces } from "./PolynomialDualSpaceScene";
import "./LagrangeBasisScene.css";

// Both axes use 48 design pixels per unit.
const sx = (x: number) => 72 + 48 * x;
const sy = (y: number) => 112 - 48 * y;
function BasisGraph({ index, activeNode }: { index: number; activeNode: number | null }) {
  const curve = Array.from({ length: 101 }, (_, sample) => {
    const x = -1.2 + sample * 2.4 / 100;
    return `${sample ? "L" : "M"}${sx(x)},${sy(lagrangeValue(index, x))}`;
  }).join(" ");
  return <div data-layout-content className="lagrange-basis-graph" data-role="lagrange-basis-graph" data-basis-index={index}>
    <MathFormula latex={`l_${index}`} />
    <svg viewBox="0 0 150 170" role="img" aria-label={`拉格朗日基函数 l${index}，在节点 ${lagrangeNodes[index]} 处取值 1，在其余两个节点处取值 0`}>
      <path className="lagrange-axis" d={`M10,${sy(0)} H140 M${sx(0)},135 V25`} />
      <path className="lagrange-guide" d={`M${sx(-1)},${sy(1)} H${sx(1)}`} />
      <path className="lagrange-curve" d={curve} />
      {activeNode !== null && <g className="lagrange-probe" style={{ transform: `translateX(${48 * activeNode}px)` }}>
        <path d={`M${sx(0)},20 V140`} />
      </g>}
      <g className="lagrange-ticks">
        <SvgFormula x={sx(0) - 23} y={sy(1) - 13} width={19} height={28} latex="1" />
        {lagrangeNodes.map((node, j) => <g key={node}>
          <circle cx={sx(node)} cy={sy(lagrangeValue(index, node))} r={5.5} className="lagrange-node" data-active={node === activeNode} />
          <SvgFormula x={sx(node) - 16} y={sy(0) + 18} width={32} height={30} latex={String(node)} />
          {index === j && <path className="lagrange-guide" d={`M${sx(node)},${sy(1) + 5} V${sy(0)}`} />}
        </g>)}
      </g>
    </svg>
  </div>;
}


function BasisScaling() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const clockElement = ref.current;
    const scene = clockElement?.closest<HTMLElement>(".lagrange-scene");
    if (clockElement && scene) return animateLagrangeScaling(scene, clockElement);
  }, []);
  return <div ref={ref} className="lagrange-scaling-clock" aria-hidden="true" />;
}

export function LagrangeBasisScene({ step }: { step: number }) {
  const active = step >= 6 && step <= 8 ? step - 6 : null;
  return <section className="polynomial-scene lagrange-scene" data-basis-focused={step >= 1} data-isolated={step >= 5} data-sampled={step >= 9} data-weighted={step >= 10} aria-label="用函数图像展示拉格朗日基">
    <PolynomialSpaces showDual />
    {step >= 1 && <div data-layout-content className="lagrange-sampling" data-role="lagrange-sampling"><span>采样点</span><MathFormula latex={"-1,\\;0,\\;1"} /></div>}
    {step >= 2 && <div className="lagrange-basis" data-role="lagrange-basis">
      {lagrangeNodes.slice(0, Math.min(step - 1, 3)).map((_, index) => <BasisGraph index={index} activeNode={active === null ? null : lagrangeNodes[active]} key={index} />)}
    </div>}
    {<div className="lagrange-functionals" aria-hidden={step >= 9} data-role="lagrange-functionals">
      {lagrangeNodes.map((node, index) => <div key={node} data-layout-content data-functional-index={index} data-active={active === null || active === index}>
        <span className="lagrange-functional-name"><MathFormula latex={`f_${index}:`} /></span>
        <MathFormula latex={`p\\mapsto p(${node})`} />
      </div>)}
    </div>}
    {active !== null && <div data-layout-content className="lagrange-delta-row" data-role="lagrange-delta-row" key={active}>
      {lagrangeNodes.map((_, index) => <MathFormula key={index} latex={`\\textcolor{#ba91ef}{f_${active}}(\\textcolor{#f4c95d}{l_${index}})=${Number(index === active)}`} />)}
    </div>}
    {step >= 9 && <div data-layout-content className="lagrange-polynomial" data-role="lagrange-polynomial">
      <MathFormula latex={"p\\in P_2(\\mathbb R)"} />
      <svg viewBox="0 0 360 190" role="img" aria-label="一个二次多项式及其在负一、零、一处的采样值">
        <path className="lagrange-axis" d="M30,155 H330 M180,175 V10" />
        <path className="lagrange-p-curve" d={Array.from({ length: 101 }, (_, i) => {
          const x = -1.3 + i * 2.6 / 100;
          return `${i ? "L" : "M"}${180 + 100 * x},${155 - 100 * (examplePolynomial(x))}`;
        }).join(" ")} />
        {lagrangeNodes.map(node => <g key={node}>
          <path className="lagrange-guide" d={`M${180 + node * 100},155 V${155 - 100 * (examplePolynomial(node))}`} />
          <circle data-role="polynomial-sample" className="lagrange-node" cx={180 + node * 100} cy={155 - 100 * (examplePolynomial(node))} r={5.5} />
          <SvgFormula x={164 + 100 * node} y={157} width={32} height={32} latex={String(node)} />
        </g>)}
      </svg>
    </div>}
    {step >= 9 && lagrangeNodes.map((node, index) => <div key={node} data-layout-content className={`lagrange-reading lagrange-reading-${index}`} data-role="lagrange-reading"><MathFormula latex={`p(${node})`} /></div>)}
    {step >= 10 && <div className="lagrange-graph-equation" aria-label="三个采样读数作为基函数的系数">
      <span data-layout-content className="lagrange-equation-input"><MathFormula latex="p=" /></span>
      <span data-layout-content className="lagrange-equation-plus first"><MathFormula latex="+" /></span>
      <span data-layout-content className="lagrange-equation-plus second"><MathFormula latex="+" /></span>
    </div>}
    {step >= 10 && <BasisScaling />}
  </section>;
}
