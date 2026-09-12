import { useLayoutEffect, useRef } from "react";
import { FruitBag } from "../components/FruitBag";
import { MathFormula } from "../components/MathFormula";
import { basis } from "../lib/math/bags";
import type { SceneProps } from "../lib/scenes/types";
import "./BasisScene.css";

const examples = [{ apples: 2, bananas: 1 }, { apples: 1, bananas: 2 }, { apples: .5, bananas: 1.5 }, { apples: -1, bananas: 1 }, { apples: 0, bananas: 0 }];

// 同一批袋子和系数从展开式移动到矩阵位置；坐标均为设计画布单位。
const targets: Record<string, readonly [number, number]> = {
  "basis-1": [650, 405], "basis-2": [920, 405],
  a: [1195, 345], b: [1195, 465],
};

export function BasisScene({ step }: SceneProps) {
  const root = useRef<HTMLElement>(null);
  const previousStep = useRef(step);

  useLayoutEffect(() => {
    const scene = root.current!;
    const bounds = scene.getBoundingClientRect();
    const scale = bounds.width / 1440;
    const animations: Animation[] = [];
    scene.querySelectorAll<HTMLElement>("[data-motion]").forEach(element => {
      const key = element.dataset.motion!;
      const from = { transform: getComputedStyle(element).transform, opacity: getComputedStyle(element).opacity };
      const rect = element.getBoundingClientRect();
      const translation = new DOMMatrix(from.transform === "none" ? undefined : from.transform);
      const origin = [(rect.x + rect.width / 2 - bounds.x) / scale - translation.m41, (rect.y + rect.height / 2 - bounds.y) / scale - translation.m42];
      const target = step >= 3 ? targets[key] : undefined;
      const transform = target ? `translate(${target[0] - origin[0]}px, ${target[1] - origin[1]}px)` : "none";
      const opacity = step >= 3 && key === "plus" ? "0" : "1";
      element.style.transform = transform;
      element.style.opacity = opacity;
      if (previousStep.current >= 2 && step >= 2 && previousStep.current !== step) {
        animations.push(element.animate([from, { transform, opacity }], { duration: 1200, easing: "ease-in-out" }));
      }
    });
    previousStep.current = step;
    return () => animations.forEach(animation => animation.cancel());
  }, [step]);

  const equation = step >= 2;
  return <section ref={root} className={`basis-scene stage-${step} ${step >= 3 ? "matrix-form" : "expanded-form"}`} aria-label="水果袋空间中的两个基袋与线性组合" data-role="basis-scene">
    {!equation && <>
      <div className="bag-universe"><span className="universe-symbol"><MathFormula latex="V" /></span></div>
      <div className="space-examples">
        {examples.map((bag, index) => <div className={`space-sample sample-${index}`} key={index}><FruitBag {...bag} /></div>)}
        <div className="space-dots"><MathFormula latex={"\\cdots"} /></div>
      </div>
      {step === 1 && <div className="basis-pair" data-role="basis-pair">
        {basis.map((bag, index) => <div key={index} className={`basis-term term-${index}`}>
          <div className="basis-label"><MathFormula latex={`e_${index + 1}`} /></div>
          <FruitBag {...bag} />
        </div>)}
      </div>}
    </>}
    {equation && <div className="combination-equation" data-role="combination-equation">
      <div data-motion="result" data-role="combination-result" data-apples="a" data-bananas="b">
        <FruitBag apples="a" bananas="b" />
      </div>
      <span data-motion="equals"><MathFormula latex="=" /></span>
      <div className="combination-term">
        <span data-motion="a"><MathFormula latex="a" /></span>
        <div data-motion="basis-1"><FruitBag {...basis[0]} /></div>
      </div>
      <span data-motion="plus"><MathFormula latex="+" /></span>
      <div className="combination-term">
        <span data-motion="b"><MathFormula latex="b" /></span>
        <div data-motion="basis-2"><FruitBag {...basis[1]} /></div>
      </div>
    </div>}
    {equation && <div className="general-domain"><MathFormula latex={"a,b\\in\\mathbb R"} /></div>}
    {equation && <>
      <div className="matrix-bracket row-bracket" data-role="basis-row">
        <MathFormula latex={"\\left[\\vphantom{\\rule[-1.35em]{0pt}{3.2em}}\\kern 5.9em\\right]"} />
      </div>
      <div className="matrix-bracket column-bracket" data-role="coordinate-column">
        <MathFormula latex={"\\left[\\vphantom{\\rule[-1.35em]{0pt}{3.2em}}\\kern .75em\\right]"} />
      </div>
    </>}
  </section>;
}
