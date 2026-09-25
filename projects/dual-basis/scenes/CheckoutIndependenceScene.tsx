import { PricedCheckout } from "../components/PricedCheckout";
import { useLayoutEffect, useRef } from "react";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { FruitBag } from "../components/FruitBag";
import { animateContourTransform, type OutlinePair } from "../lib/animation/contourTransform";
import independenceShapes from "../lib/animation/independence-shapes.json";
import "./CheckoutIndependenceScene.css";

const counters = [
  { label: "f_1", apples: 1, bananas: 0, color: "#ed6a5a" },
  { label: "f_2", apples: 0, bananas: 1, color: "#f4c95d" },
  { label: "0", apples: 0, bananas: 0, color: "#b9bec5" },
];

export function CheckoutIndependenceScene({ step }: { step: number }) {
  const basis = step >= 5 ? 2 : 1;
  const bag = { apples: basis === 1 ? 1 : 0, bananas: basis === 2 ? 1 : 0 };
  const placed = step >= 2;
  const evaluated = step === 3 || step === 4 || step >= 6;
  const results = counters.map(counter => counter.apples * bag.apples + counter.bananas * bag.bananas);
  return <section className="independence-scene" aria-label="两个收银台线性无关" data-basis={basis}>
    <h1><span style={{ color: counters[0].color }}><MathFormula latex="f_1" /></span><MathFormula latex={",\\,"} /><span style={{ color: counters[1].color }}><MathFormula latex="f_2" /></span> 线性无关</h1>
    {step >= 1 && <>
      <div className="independence-equation" >
        {counters.map((counter, index) => <div className="independence-term" data-term={index} key={counter.label} style={{ color: counter.color }}>
          {index > 0 && <span className="independence-operator"><MathFormula latex={index === 1 ? "+" : "="} /></span>}
          <div className="independence-machine-expression">
            {index < 2 && <span className="independence-coefficient"><MathFormula latex={index === 0 ? "x" : "y"} /></span>}
            <div className="independence-counter">
              <PricedCheckout apples={counter.apples} bananas={counter.bananas} color={counter.color} scale={.48}>
              {placed && <div key={basis} className="checkout-tray-bag independence-tray-bag">
                <FruitBag {...bag} tone={basis === 1 ? "apple" : "banana"} />
              </div>}
              </PricedCheckout>
              <span className="independence-counter-label"><MathFormula latex={counter.label} /></span>
            </div>
          </div>
        </div>)}
      </div>
      {evaluated && <EvaluationRow key={basis} basis={basis} results={results} />}
      <div className="independence-conclusions">
        {step >= 4 && <MathFormula latex="x=0" />}
        {step >= 7 && <MathFormula latex="y=0" />}
      </div>
    </>}
  </section>;
}

// 保留原等式；将完整的带系数结算项复制并连续变形成计算结果。
function EvaluationRow({ basis, results }: { basis: number; results: number[] }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const layer = root.current!;
    const scene = layer.closest("section")!;
    const outlines = independenceShapes as unknown as Record<string, OutlinePair>;
    const cleanups = [...layer.querySelectorAll<HTMLElement>("[data-from]")].map(target => {
      const selector = target.dataset.from!;
      return animateContourTransform({
        layer: layer.querySelector<HTMLElement>(".independence-morph-layer")!,
        source: scene.querySelector<HTMLElement>(selector)!, target,
        outlines: outlines[`${basis}:${selector}`], duration: 1100,
      });
    });
    return () => cleanups.forEach(cleanup => cleanup());
  }, [basis]);
  const source = (index: number) => `[data-term="${index}"] .independence-machine-expression`;
  return <div ref={root} className="independence-evaluation" aria-label={basis === 1 ? "x 加零等于零" : "零加 y 等于零"}>
    {counters.map((counter, index) => <div className="independence-result-term" key={counter.label}>
      {index > 0 && <span className="independence-result-operator" data-from={`[data-term="${index}"] .independence-operator .katex`}><MathFormula latex={index === 1 ? "+" : "="} /></span>}
      <span className="independence-number" style={{ color: counter.color }} data-from={source(index)}><MathFormula latex={results[index] === 0 ? "0" : index === 0 ? "x" : "y"} /></span>
    </div>)}
    <div className="independence-morph-layer" aria-hidden="true" />
  </div>;
}
