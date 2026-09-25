import { Fragment, useLayoutEffect, useRef, type CSSProperties } from "react";
import { CheckoutPlacement } from "@math-visualizations/scene-kit/CheckoutPlacement";
import { CheckoutIcon } from "@math-visualizations/scene-kit/CheckoutIcon";
import { UnitPrices } from "@math-visualizations/scene-kit/UnitPrices";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { FruitBag } from "../components/FruitBag";
import { basis, evaluate, probes } from "../lib/math/bags";
import { animateContourTransform, type OutlinePair } from "../lib/animation/contourTransform";
import coordinateShapes from "../lib/animation/coordinate-shapes.json";
import "./DualBasisScene.css";
import "./CoordinateReadingScene.css";

const bag = { apples: 3, bananas: 2 } as const;

export function CoordinateReadingScene({ step }: SceneProps) {
  return <section className={`dual-basis-scene coordinate-reading-scene ${step >= 3 ? "show-expansion" : ""}`} aria-label="对偶基分别读出苹果和香蕉的斤数">
    <div className="basis-bag general-source">
      <FruitBag {...bag} />
    </div>
    {probes.map((probe, index) => {
      const measured = step > index;
      const value = evaluate(probe, bag);
      return <Fragment key={index}><div className={`probe ${step === index + 1 ? "active" : ""}`} style={{ "--probe-color": probe.color } as CSSProperties} data-role="checkout" data-probe={index + 1}>
        <div className="probe-name"><MathFormula latex={`f_${index + 1}`} /></div>
        <div className="priced-machine">
          <CheckoutIcon accent="#eceee8" largeScreen />
          <UnitPrices apples={probe.applePrice} bananas={probe.bananaPrice} />
          <div className="checkout-tray" data-role="checkout-tray" />
          {measured && <CheckoutPlacement className="checkout-tray-bag" source=".general-source .fruit-bag" data-role="tray-bag">
            <FruitBag {...bag} />
          </CheckoutPlacement>}
        </div>
      </div>
        {measured && <div className="checkout-reading" data-role="reading" data-probe={index + 1} data-value={value}><MathFormula latex={String(value)} /></div>}
      </Fragment>;
    })}
    {step >= 3 && <div className="basis-expansion" data-role="basis-expansion">
      <div className="expansion-equals"><MathFormula latex="=" /></div>
      <div className="expansion-plus"><MathFormula latex="+" /></div>
      {basis.map((unit, index) => <div key={index} className={`expansion-unit unit-${index}`}><FruitBag {...unit} tone={index === 0 ? "apple" : "banana"} /></div>)}
    </div>}
    {step >= 4 && <SymbolicExpansion expanded={step >= 5} />}
  </section>;
}


function SymbolicExpansion({ expanded }: { expanded: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const layer = root.current!;
    const scene = layer.closest("section")!;
    const outlines = coordinateShapes as unknown as Record<string, OutlinePair>;
    const cleanups = [...layer.querySelectorAll<HTMLElement>(".symbolic-base[data-symbol-source]")].map(target => {
      const selector = target.dataset.symbolSource!;
      return animateContourTransform({ layer, source: scene.querySelector<HTMLElement>(selector)!, target, outlines: outlines[selector] });
    });
    return () => cleanups.forEach(cleanup => cleanup());
  }, []);
  return <div ref={root} className={`symbolic-expansion ${expanded ? "coefficients-expanded" : ""}`} data-role="symbolic-expansion" aria-label={expanded ? "v 等于 f1(v) e1 加 f2(v) e2" : "v 等于 3e1 加 2e2"}>
      <div className="symbolic-vector symbolic-base" data-symbol-source=".general-source .fruit-bag"><MathFormula latex="v" /></div>
      <div className="symbolic-equals symbolic-base" data-symbol-source=".expansion-equals"><MathFormula latex="=" /></div>
      <div className="symbolic-plus symbolic-base" data-symbol-source=".expansion-plus"><MathFormula latex="+" /></div>
      {[1, 2].map(index => <Fragment key={index}>
        <SymbolicCoefficient index={index} expanded={expanded} />
        <div className={`symbolic-basis symbolic-base symbolic-color-${index}`} data-symbol-source={`.expansion-unit.unit-${index - 1} .fruit-bag`}><MathFormula latex={`e_${index}`} /></div>
      </Fragment>)}
  </div>;
}


function SymbolicCoefficient({ index, expanded }: { index: number; expanded: boolean }) {
  const number = useRef<HTMLDivElement>(null);
  const formula = useRef<HTMLDivElement>(null);
  const selector = `.checkout-reading[data-probe="${index}"]`;
  useLayoutEffect(() => {
    const layer = number.current!.closest<HTMLElement>('.symbolic-expansion')!;
    const pair = (coordinateShapes as unknown as Record<string, OutlinePair>)[selector];
    return animateContourTransform({
      layer,
      source: expanded ? number.current! : layer.closest('section')!.querySelector<HTMLElement>(selector)!,
      target: expanded ? formula.current! : number.current!,
      outlines: expanded ? pair : { from: pair.from, to: pair.from },
    });
  }, [expanded, selector]);
  return <>
    <div ref={number} className={`symbolic-coefficient symbolic-number symbolic-color-${index}`} data-role="symbolic-number">
      <MathFormula latex={String(index === 1 ? bag.apples : bag.bananas)} />
    </div>
    {expanded && <div ref={formula} className={`symbolic-coefficient symbolic-color-${index}`} data-symbol-source={selector} data-role="symbolic-functional">
      <MathFormula latex={`f_${index}`} /><span className="parenthesis-color"><MathFormula latex="(" /></span><span className="vector-color"><MathFormula latex="v" /></span><span className="parenthesis-color"><MathFormula latex=")" /></span>
    </div>}
  </>;
}
