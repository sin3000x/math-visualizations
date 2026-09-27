import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { useLayoutEffect, useRef } from "react";
import "./PolynomialDualSpaceScene.css";

const monomials = ["1", "x", "x^2"];
const coefficientReadings = ["p(0)", "p'(0)", "\\frac{p''(0)}{2}"];

function CoefficientReading({ index, substituted }: { index: number; substituted: boolean }) {
  const coefficientRef = useRef<HTMLSpanElement>(null);
  const extractedRef = useRef<HTMLSpanElement>(null);
  const previousPosition = useRef<{ x: number; y: number; substituted: boolean } | null>(null);

  useLayoutEffect(() => {
    const target = extractedRef.current;
    const scene = target?.closest<HTMLElement>(".polynomial-scene");
    if (!target || !scene) return;
    const sceneBounds = scene.getBoundingClientRect();
    const scale = sceneBounds.width / 1440;
    const bounds = target.getBoundingClientRect();
    const end = { x: (bounds.left - sceneBounds.left) / scale, y: (bounds.top - sceneBounds.top) / scale, substituted };
    const start = previousPosition.current;
    previousPosition.current = end;
    if (!start || start.substituted === substituted || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Move the formula itself so the surrounding layout cannot bend its path.
    const animation = target.animate([
      { transform: `translate(${start.x - end.x}px, ${start.y - end.y}px)` },
      { transform: "translate(0, 0)" },
    ], { duration: 500, easing: "linear" });
    return () => {
      const progress = Math.min(1, Math.max(0, Number(animation.currentTime ?? 500) / 500));
      previousPosition.current = { x: start.x + (end.x - start.x) * progress, y: start.y + (end.y - start.y) * progress, substituted };
      animation.cancel();
    };
  }, [substituted]);

  useLayoutEffect(() => {
    const target = coefficientRef.current;
    const scene = target?.closest<HTMLElement>(".polynomial-scene");
    const source = scene?.querySelector<HTMLElement>(`[data-role="polynomial-source-coefficient"][data-coefficient-index="${index}"] .math-formula`);
    if (!target || !scene || !source || scene.dataset.substituted === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = source.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    const scale = scene.getBoundingClientRect().width / 1440;
    const animation = target.animate([
      { transform: `translate(${(start.left - end.left) / scale}px, ${(start.top - end.top) / scale}px)` },
      { transform: "translate(0, 0)" },
    ], { duration: 1000, easing: "cubic-bezier(.4, 0, .2, 1)" });
    return () => animation.cancel();
  }, [index]);

  useLayoutEffect(() => {
    if (substituted) coefficientRef.current?.getAnimations().forEach(animation => animation.cancel());
  }, [substituted]);

  return <div className={`polynomial-coefficient-reading polynomial-column-${index}`} data-role="polynomial-coefficient-reading" data-coefficient-index={index}>
    <span className="polynomial-reading-content">
      <span ref={extractedRef} className="polynomial-extracted-coefficient" data-role="polynomial-extracted-coefficient" data-coefficient-index={index}><MathFormula latex={coefficientReadings[index]} /></span>
      <span className="polynomial-reading-equality" aria-hidden={substituted}>
        <MathFormula latex="=" />
        <span ref={coefficientRef} className="polynomial-reading-coefficient" data-role="polynomial-reading-coefficient" data-coefficient-index={index}><MathFormula latex={`a_${index}`} /></span>
      </span>
    </span>
  </div>;
}

function IntegralCombination({ expanded }: { expanded: boolean }) {
  const resultRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const result = resultRef.current;
    const scene = result?.closest<HTMLElement>(".polynomial-scene");
    if (!expanded || !result || !scene || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scale = scene.getBoundingClientRect().width / 1440;
    const animations: Animation[] = [];
    result.querySelectorAll<HTMLElement>(".polynomial-dual-value").forEach((target, index) => {
      const source = scene.querySelector<HTMLElement>(`[data-role="polynomial-extracted-coefficient"][data-coefficient-index="${index}"]`);
      if (!source) return;
      const start = source.getBoundingClientRect();
      const end = target.getBoundingClientRect();
      const dx = (start.left + start.width / 2 - end.left - end.width / 2) / scale;
      const dy = (start.top + start.height / 2 - end.top - end.height / 2) / scale;
      animations.push(target.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${start.width / end.width})` },
        { transform: "translate(0, 0) scale(1)" },
      ], { duration: 500, easing: "linear" }));
    });
    result.querySelectorAll<HTMLElement>(".polynomial-integral-weight").forEach(target => {
      animations.push(target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 250, fill: "backwards" }));
    });
    return () => animations.forEach(animation => animation.cancel());
  }, [expanded]);

  return <span ref={resultRef} className="polynomial-integral-result" data-role="polynomial-integral-result" data-expanded={expanded} aria-hidden={!expanded}>
    {coefficientReadings.map((latex, index) => <span className="polynomial-integral-term" key={latex}>
      <span className="polynomial-integral-weight"><MathFormula latex={["=", "+\\frac12", "+\\frac13"][index]} /></span>
      <span className="polynomial-dual-value" data-coefficient-index={index}><MathFormula latex={latex} /></span>
    </span>)}
  </span>;
}

export function PolynomialSpaces({ showDual, hidden = false }: { showDual: boolean; hidden?: boolean }) {
  return (
    <div className="polynomial-spaces" aria-hidden={hidden}>
      <div className="polynomial-space polynomial-vectors" data-role="polynomial-space">
        <div className="polynomial-space-label"><MathFormula latex={"V=P_2(\\mathbb R)"} /></div>
        <div className="polynomial-examples">
          {["1+2x-x^2", "3-2x", "2-x+3x^2"].map(latex => <MathFormula key={latex} latex={latex} />)}
          <MathFormula latex={"\\cdots"} />
        </div>
      </div>
      {showDual && <div className="polynomial-space polynomial-functionals" data-role="polynomial-dual-space">
        <div className="polynomial-space-label"><MathFormula latex={"V^*"} /></div>
        <div className="polynomial-functional-examples">
          <MathFormula latex={"p\\mapsto p(0)"} />
          <MathFormula latex={"p\\mapsto p'(1)"} />
          <MathFormula latex={"\\displaystyle p\\mapsto\\int_0^1 p(x)\\,\\mathrm{d}x"} />
          <MathFormula latex={"\\cdots"} />
        </div>
      </div>}
    </div>
  );
}

export function PolynomialDualSpaceScene({ step }: { step: number }) {
  const focused = step >= 2;
  const algebra = step >= 3;
  const substituted = step >= 7;
  return <section className="polynomial-scene" data-basis-focused={focused} data-algebra={algebra} data-substituted={substituted} aria-label="单项式基与读取多项式系数的对偶基">
    <PolynomialSpaces showDual={step >= 1} hidden={algebra} />
    {focused && <div className="polynomial-monomial-basis" data-role="monomial-basis" aria-label="单项式基：1、x、x 的平方">
      {monomials.map((latex, index) => <div className="polynomial-basis-token" data-basis-index={index} aria-hidden={algebra && index === 0} key={latex}><MathFormula latex={latex} /></div>)}
    </div>}
    {algebra && <div className="polynomial-algebra" data-role="polynomial-algebra">
      <div className="polynomial-expansion" data-role="polynomial-expansion">
        <span className="polynomial-expansion-input"><MathFormula latex="p(x)=" /></span>
        {monomials.map((_, index) => <span className={`polynomial-symbolic-coefficient polynomial-column-${index}`} data-role="polynomial-source-coefficient" data-coefficient-index={index} key={index} aria-hidden={substituted}><MathFormula latex={`a_${index}`} /></span>)}
        <span className="polynomial-plus polynomial-plus-1"><MathFormula latex="+" /></span>
        <span className="polynomial-plus polynomial-plus-2"><MathFormula latex="+" /></span>
      </div>
      {coefficientReadings.map((_, index) => step >= index + 4 && <CoefficientReading index={index} substituted={substituted} key={index} />)}
      {step >= 8 && <div className="polynomial-integral-expansion" data-role="polynomial-integral-expansion">
        <MathFormula latex={"\\displaystyle\\int_0^1\\textcolor{#62d2c3}{p(x)}\\,\\mathrm{d}x"} />
        <IntegralCombination expanded={step >= 9} />
      </div>}
    </div>}
  </section>;
}
