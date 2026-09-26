import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { CheckoutPlacement } from "@math-visualizations/scene-kit/CheckoutPlacement";
import { ExtractSharedInput } from "../components/ExtractSharedInput";
import { RollingFruitBag } from "../components/RollingFruitBag";
import { FruitBag } from "../components/FruitBag";
import { PricedCheckout } from "../components/PricedCheckout";
import { animateContourTransform, type OutlinePair } from "../lib/animation/contourTransform";
import spanningShapes from "../lib/animation/spanning-shapes.json";
import "./CheckoutSpanningScene.css";

const examples = [[3, 2], [1, 4], [5, 1], [2, 3], [4, 2], [1, 1], [3, 5], [2, 4], [4, 3]] as const;
const HOLD_MS = 200;
const ROLL_MS = 250;
const CYCLE_MS = HOLD_MS + ROLL_MS;
const ROLL_DURATION = (examples.length - 1) * CYCLE_MS + HOLD_MS;
const colors = ["#b995eb", "#ed6a5a", "#f4c95d"];

export function CheckoutSpanningScene({ step }: { step: number }) {
  const [cycle, setCycle] = useState({ step, sample: 0 });
  // 切步时在绘制前重置读数，重播不能先显示上次停留的最后一袋。
  if (cycle.step !== step) setCycle({ step, sample: step >= 6 ? cycle.sample : 0 });
  const sample = cycle.step === step || step >= 6 ? cycle.sample : 0;
  const clock = useRef<HTMLDivElement>(null);
  const morphLayer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (step !== 2) return;
    const layer = morphLayer.current!;
    const scene = layer.closest("section")!;
    const shapes = spanningShapes as unknown as Record<string, OutlinePair>;
    const cleanups = [1, 2].map(index => {
      return animateContourTransform({ layer,
        source: scene.querySelector<HTMLElement>(`.number-${index}`)!,
        target: scene.querySelector<HTMLElement>(`.dual-${index}`)!,
        outlines: shapes[index], duration: 1000,
      });
    });
    return () => cleanups.forEach(cleanup => cleanup());
  }, [step]);
  useLayoutEffect(() => {
    const drums = [...clock.current!.closest("section")!.querySelectorAll<HTMLElement>('[data-role="bag-reel-strip"]')];
    if (step !== 5) {
      if (step < 6) drums.forEach(drum => { drum.style.transform = ""; });
      return;
    }
    const animation = clock.current!.animate([{ opacity: 1 }, { opacity: 1 }], { duration: ROLL_DURATION, fill: "forwards" });
    let frame = 0;
    const tick = () => {
      const time = Number(animation.currentTime ?? 0);
      const index = Math.min(8, Math.floor(time / CYCLE_MS));
      const progress = index === 8 ? 0 : Math.max(0, Math.min(1, (time % CYCLE_MS - HOLD_MS) / ROLL_MS));
      const eased = progress * progress * (3 - 2 * progress);
      drums.forEach(drum => {
        const height = (drum.firstElementChild as HTMLElement).offsetHeight;
        drum.style.transform = `translateY(${-(index + eased) * height}px)`;
      });
      setCycle(current => current.step === step && current.sample === index ? current : { step, sample: index });
      if (animation.playState !== "finished") frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); animation.cancel(); drums.forEach(drum => { if (drum.closest<HTMLElement>("section")?.dataset.complete !== "true") drum.style.transform = ""; }); };
  }, [step]);
  const [apples, bananas] = examples[step >= 5 ? sample : 0];
  const grouped = step >= 4;
  const bag = (basis = 0, rolling = false) => rolling
    ? <RollingFruitBag examples={examples} sample={step >= 5 ? sample : 0} />
    : <FruitBag apples={basis === 1 ? 1 : basis === 2 ? 0 : apples} bananas={basis === 2 ? 1 : basis === 1 ? 0 : bananas} tone={basis === 1 ? "apple" : basis === 2 ? "banana" : undefined} />;
  return <section className="spanning-scene" data-stage={step} data-complete={step >= 6} data-review={step >= 7} data-sample={sample} aria-label="f1、f2 可以张成整个对偶空间">
    <h1><span style={{ color: colors[1] }}><MathFormula latex="f_1" /></span><MathFormula latex={",\\,"} /><span style={{ color: colors[2] }}><MathFormula latex="f_2" /></span> 可以张成整个对偶空间</h1>
    <div className="spanning-content">
    <div ref={clock} className="spanning-clock" aria-hidden="true" />
    <span className="spanning-equals"><MathFormula latex="=" /></span>
    <span className="spanning-plus"><MathFormula latex="+" /></span>
    {[1, 2].map(index => <span key={index} className={`spanning-number number-${index}`} style={{ color: colors[index], visibility: step < 2 ? "visible" : "hidden" }}><MathFormula latex={index === 1 ? "3" : "2"} /></span>)}
    {[0, 1, 2].map(index => <div key={index} className={`spanning-evaluation evaluation-${index}`} data-evaluation={index}>
      <div className="spanning-source" data-source={index} style={{ visibility: step === 0 ? "visible" : "hidden" }}>{bag(index)}</div>
      {step >= 1 && <>
        <div className="spanning-machine-reveal">
          <PricedCheckout apples={0} bananas={0} hidePrices color={colors[0]} scale={.4} />
          <span className="spanning-counter-name" style={{ color: colors[0] }}><MathFormula latex="f" /></span>
        </div>
        <CheckoutPlacement className="spanning-tray-bag" source={`[data-source="${index}"] .fruit-bag`} duration={800}>
          {bag(index, index === 0)}
        </CheckoutPlacement>
      </>}
    </div>)}
    {step >= 2 && [1, 2].map(index => <div key={index} className={`spanning-dual dual-${index}`} style={{ "--dual-color": colors[index] } as CSSProperties}>
      <div className="spanning-dual-machine">
      <PricedCheckout apples={index === 1 ? 1 : 0} bananas={index === 2 ? 1 : 0} color={colors[index]} scale={.4} />
      <span className="spanning-counter-name"><MathFormula latex={`f_${index}`} /></span>
      </div>
      <div className="spanning-tray-bag" data-role="morphed-input" style={{ visibility: grouped ? "hidden" : undefined }}>{bag()}</div>
    </div>)}
    <div ref={morphLayer} className="spanning-morph-layer" aria-hidden="true" />
    {grouped && <>
      <span className="spanning-bracket opening"><MathFormula latex="(" /></span>
      <span className="spanning-bracket closing"><MathFormula latex=")" /></span>
      <div className="spanning-argument">{bag(0, true)}</div>
      {step === 4 && <ExtractSharedInput>{bag()}</ExtractSharedInput>}
    </>}
    {step >= 6 && <div className="spanning-decomposition" aria-label="f = f(e1) f1 + f(e2) f2">
      <span className="decomposition-f"><MathFormula latex={"\\color{#b995eb}{f}"} /></span>
      <span className="decomposition-equals"><MathFormula latex="=" /></span>
      <span className="decomposition-coefficient-1"><MathFormula latex={"\\color{#b995eb}{f({\\color{#ed6a5a}e_1})}"} /></span>
      <span className="decomposition-basis-1"><MathFormula latex={"\\color{#ed6a5a}{f_1}"} /></span>
      <span className="decomposition-plus"><MathFormula latex="+" /></span>
      <span className="decomposition-coefficient-2"><MathFormula latex={"\\color{#b995eb}{f({\\color{#f4c95d}e_2})}"} /></span>
      <span className="decomposition-basis-2"><MathFormula latex={"\\color{#f4c95d}{f_2}"} /></span>
    </div>}
    </div>
    {step >= 7 && <div className="spanning-coordinate-summary">
      <p><MathFormula latex="f" /> 在 <MathFormula latex="V^*" /> 中的坐标</p>
      <MathFormula latex={"[f]_{(f_1,f_2)}=\\begin{bmatrix} f({\\color{#ed6a5a}e_1}) \\\\[0.35em] f({\\color{#f4c95d}e_2}) \\end{bmatrix}"} />
    </div>}
    {step >= 8 && <aside className="spanning-right-panel" aria-label={step === 8 ? "回顾 f 在 V 中的作用" : "v 在 V 中的坐标"}>
      <div className="spanning-row-review" aria-hidden={step >= 9}>
        <p><MathFormula latex="f" /> 在 <MathFormula latex="V" /> 中的作用</p>
        <MathFormula latex={"f(v)=\\begin{bmatrix}f({\\color{#ed6a5a}e_1})&f({\\color{#f4c95d}e_2})\\end{bmatrix}[v]_{(e_1,e_2)}"} />
      </div>
      <div className="spanning-vector-coordinates" aria-hidden={step < 9}>
      <p><MathFormula latex="v" /> 在 <MathFormula latex="V" /> 中的坐标</p>
      <MathFormula latex={"[v]_{(e_1,e_2)}=\\begin{bmatrix}{\\color{#ed6a5a}f_1}(v) \\\\[0.35em] {\\color{#f4c95d}f_2}(v)\\end{bmatrix}"} />
      </div>
    </aside>}
  </section>;
}
