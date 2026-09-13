import { useLayoutEffect, useRef } from "react";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { FruitBag } from "../components/FruitBag";
import { FruitIcon } from "../components/FruitIcon";
import { MathFormula } from "../components/MathFormula";
import { basis } from "../lib/math/bags";
import { changedBasis, changedRow } from "../lib/math/changeBasis";
import type { SceneProps } from "../lib/scenes/types";
import "./CheckoutBasisScene.css";
import "./ChangeBasisScene.css";

function PriceProduct({ isNew, step }: { isNew: boolean; step: number }) {
  const prefix = isNew ? 'new' : 'old';
  const columnStep = isNew ? 7 : 2;
  const rowStep = isNew ? 5 : 2;
  const resultStep = isNew ? 7 : 2;
  return <div className="change-product" data-role={`${prefix}-basis-product`}>
    <span className={`change-price-vector ${step < rowStep ? 'change-hidden' : ''}`} data-vector-step={rowStep} data-vector-sources={isNew ? 'quote-0,quote-1' : 'price-0,price-1'} data-vector-delay={isNew ? 1900 : 1100} data-sequential={isNew ? "true" : undefined}>
      <MathFormula latex={isNew ? "\\begin{bmatrix}8&3\\end{bmatrix}" : "\\begin{bmatrix}5&3\\end{bmatrix}"} />
    </span>
    <span className={`change-coordinate-vector ${step < columnStep ? 'change-hidden' : ''}`} data-vector-step={columnStep} data-vector-sources={`${prefix}-coordinate-0,${prefix}-coordinate-1`}>
      <MathFormula latex={isNew ? "\\begin{bmatrix}2\\\\1\\end{bmatrix}" : "\\begin{bmatrix}2\\\\3\\end{bmatrix}"} />
    </span>
    <span className={`change-total ${step < resultStep ? 'change-hidden' : ''}`} data-result-step={resultStep} data-result-delay={isNew ? 1100 : 2200}><MathFormula latex="=19" /></span>
  </div>;
}

export function ChangeBasisScene({ step }: SceneProps) {
  const root = useRef<HTMLElement>(null);
  const active = step >= 6 ? 1 : 0;
  useLayoutEffect(() => {
    const scene = root.current!;
    const scale = scene.getBoundingClientRect().width / 1440;
    const animations: Animation[] = [];
    // 使用 KaTeX 原生矩阵布局；直接移动其中的数字，保留数学基线与括号间距。
    scene.querySelectorAll<HTMLElement>('[data-vector-sources]').forEach(vector => {
      const sources = vector.dataset.vectorSources!.split(',');
      const digits = [...vector.querySelectorAll<HTMLElement>('.katex-html .mord')].filter(node => /^\d$/.test(node.textContent ?? '') && !node.querySelector('.mord'));
      digits.forEach((digit, index) => {
        digit.dataset.flightSource = sources[index];
        const revealStep = Number(vector.dataset.vectorStep) + (vector.dataset.sequential ? index : 0);
        digit.dataset.flightStep = String(revealStep);
        digit.style.visibility = step < revealStep ? 'hidden' : '';
        digit.dataset.flightDelay = vector.dataset.vectorDelay ?? '0';
      });
    });
    scene.querySelectorAll<HTMLElement>(`[data-flight-step="${step}"]`).forEach(target => {
      const source = scene.querySelector(`[data-source="${target.dataset.flightSource}"]`)!;
      const from = source.getBoundingClientRect(), to = target.getBoundingClientRect();
      const dx = (from.x + from.width / 2 - to.x - to.width / 2) / scale;
      const dy = (from.y + from.height / 2 - to.y - to.height / 2) / scale;
      animations.push(target.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${from.height / to.height})`, color: getComputedStyle(source).color, opacity: 0, offset: 0 },
        { opacity: 1, offset: .02 },
        { transform: 'none', color: getComputedStyle(target).color, opacity: 1, offset: 1 },
      ], { duration: 1100, delay: Number(target.dataset.flightDelay ?? 0), fill: 'backwards', easing: 'ease-in-out' }));
    });
    scene.querySelectorAll<HTMLElement>(`[data-result-step="${step}"]`).forEach(target => {
      animations.push(target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: Number(target.dataset.resultDelay ?? 0), fill: 'backwards' }));
    });
    if (step === 5 || step === 6) {
      const quote = scene.querySelector<HTMLElement>('.change-quotes')!;
      animations.push(quote.animate([
        { opacity: 0, offset: 0 }, { opacity: 0, offset: .5 },
        { opacity: 1, offset: .64 }, { opacity: 1, offset: .86 },
        { opacity: 0, offset: 1 },
      ], { duration: 2200 }));
      const source = scene.querySelector(`[data-new-basis="${active}"] .fruit-bag`)!;
      const target = scene.querySelector<HTMLElement>('.change-probe-bag')!;
      const from = source.getBoundingClientRect(), to = target.getBoundingClientRect();
      const machineScale = scale * .72;
      animations.push(target.animate([
        { transform: `translate(${(from.x - to.x) / machineScale}px, ${(from.y - to.y) / machineScale}px) scale(${from.width / to.width})` },
        { transform: 'none' },
      ], { duration: 1100, easing: 'ease-in-out' }));
    }
    return () => animations.forEach(animation => animation.cancel());
  }, [step, active]);

  return <section ref={root} className="change-basis" data-role="change-basis" aria-label="先选基袋，再展示坐标与报价的来源">
    <div className="probe-machine change-machine">
      <CheckoutIcon accent="#62d2c3" largeScreen />
      <div className="probe-prices">
        {(["apple", "banana"] as const).map((kind, i) => <div className="probe-price" key={kind}>
          <span className={`fruit ${kind}`}><FruitIcon kind={kind} /></span>
          <span data-source={`price-${i}`}><MathFormula latex={`${i === 0 ? 5 : 3}`} /></span>
          <MathFormula latex={"\\text{元/斤}"} />
        </div>)}
      </div>
      <div className="probe-tray" data-role="checkout-tray" />
      {step >= 5 && <div className="probe-tray-bag change-probe-bag change-new-colors" key={active}><FruitBag {...changedBasis[active]} /></div>}
    </div>
    {(step === 5 || step === 6) && <div className="change-quotes" key={active}>
      <span data-source={`quote-${active}`}><MathFormula latex={`${changedRow[active]}`} /></span><MathFormula latex={"\\,\\text{元}"} />
    </div>}
    {[false, true].map(isNew => (!isNew || step >= 3) && <div className={`change-row ${isNew ? 'change-new-row change-new-colors' : 'change-old-row'}`} key={String(isNew)} data-role={isNew ? 'new-basis-combination' : 'old-basis-combination'}>
      {!isNew && <div className={`change-small-bag change-original ${step < 1 ? 'change-hidden' : ''}`}><FruitBag apples={2} bananas={3} /></div>}
      <span className={`change-equals ${step < (isNew ? 4 : 1) ? 'change-hidden' : ''}`}><MathFormula latex="=" /></span>
      {(isNew ? changedBasis : basis).map((bag, i) => <div className={`change-term change-term-${i}`} key={i}>
        {i === 1 && <span className={`change-plus ${step < (isNew ? 4 : 1) ? 'change-hidden' : ''}`}><MathFormula latex="+" /></span>}
        <span className={`change-coefficient ${step < (isNew ? 4 : 1) ? 'change-hidden' : ''}`} data-source={`${isNew ? 'new' : 'old'}-coordinate-${i}`}><MathFormula latex={`${i === 0 ? 2 : isNew ? 1 : 3}`} /></span>
        <div className="change-labeled-bag" data-new-basis={isNew ? i : undefined}>
          <div className="change-small-bag"><FruitBag {...bag} /></div>
          <MathFormula latex={`${isNew ? 'v' : 'e'}_${i + 1}`} />
        </div>
      </div>)}
      <PriceProduct isNew={isNew} step={step} />
    </div>)}
  </section>;
}
