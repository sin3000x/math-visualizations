import { useLayoutEffect, useRef } from "react";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "../components/MathFormula";
import type { SceneProps } from "../lib/scenes/types";
import "../components/FruitBag.css";
import "./CheckoutBasisScene.css";
import "./GeneralBasisScene.css";

function SymbolicBag({ symbol, basis = false }: { symbol: string; basis?: boolean }) {
  return <div className={`fruit-bag symbolic-bag ${basis ? 'symbolic-basis' : ''}`} aria-label={`符号水果袋 ${symbol}`}>
    <div className="bag-handle" /><MathFormula latex={symbol} />
  </div>;
}

// 选择完整的矩阵单元格，而不是 f、v、下标等内部字符。
const cells = '.mtable > .col-align-c > .vlist-t > .vlist-r:first-child > .vlist > span > .mord';

export function GeneralBasisScene({ step }: SceneProps) {
  const root = useRef<HTMLElement>(null);
  const active = step >= 4 ? 1 : 0;
  useLayoutEffect(() => {
    const scene = root.current!;
    const scale = scene.getBoundingClientRect().width / 1440;
    const animations: Animation[] = [];
    // 先稳定所有单元格的排版，再测量动画起点，避免居中容器宽度变化。
    for (const [selector, role] of [['.general-basis-price-row', 'general-row-entry'], ['.general-basis-column', 'general-column-entry']]) {
      scene.querySelectorAll<HTMLElement>(`${selector} ${cells}`).forEach(cell => { cell.dataset.role = role; });
    }
    const fly = (target: HTMLElement, source: Element, delay = 0) => {
      const from = source.getBoundingClientRect(), to = target.getBoundingClientRect();
      animations.push(target.animate([
        { transform: `translate(${(from.x + from.width / 2 - to.x - to.width / 2) / scale}px, ${(from.y + from.height / 2 - to.y - to.height / 2) / scale}px) scale(${from.height / to.height})`, opacity: 0, offset: 0 },
        { opacity: 1, offset: .02 }, { transform: 'translate(0px, 0px)', opacity: 1, offset: 1 },
      ], { duration: 1100, delay, fill: 'backwards', easing: 'ease-in-out' }));
    };
    scene.querySelectorAll<HTMLElement>(`.general-basis-price-row ${cells}`).forEach((cell, i) => {
      cell.style.visibility = step >= 3 + i ? 'visible' : 'hidden';
      if (step === 3 + i) fly(cell, scene.querySelector('[data-role="symbolic-quote"]')!, 1900);
    });
    if (step === 5) {
      scene.querySelectorAll<HTMLElement>(`.general-basis-column ${cells}`).forEach((cell, i) => {
        fly(cell, scene.querySelector(`[data-coordinate="${i}"]`)!);
      });
      for (const element of scene.querySelectorAll('.general-basis-product-result')) {
        animations.push(element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 1100, fill: 'backwards' }));
      }
    }
    if (step === 3 || step === 4) {
      const quote = scene.querySelector('.general-basis-quote')!;
      animations.push(quote.animate([
        { opacity: 0, offset: 0 }, { opacity: 0, offset: .5 },
        { opacity: 1, offset: .64 }, { opacity: 1, offset: .86 }, { opacity: 0, offset: 1 },
      ], { duration: 2200 }));
      const bag = scene.querySelector<HTMLElement>('.general-basis-probe')!;
      const from = scene.querySelector(`[data-basis="${active}"] .fruit-bag`)!.getBoundingClientRect();
      const to = bag.getBoundingClientRect();
      animations.push(bag.animate([
        { transform: `translate(${(from.x - to.x) / (scale * .68)}px, ${(from.y - to.y) / (scale * .68)}px) scale(${from.width / to.width})` },
        { transform: 'none' },
      ], { duration: 1100, easing: 'ease-in-out' }));
    }
    return () => animations.forEach(animation => animation.cancel());
  }, [step, active]);

  return <section ref={root} className={`general-basis-scene ${step === 0 ? "general-basis-only" : ""}`} data-role="general-basis-scene" aria-label="任意一组基下，线性结账函数的行向量由各基袋的结账结果组成">
    <div className="probe-machine general-basis-machine">
      <CheckoutIcon accent="#62d2c3" largeScreen />
      <div className="general-basis-screen"><MathFormula latex="f" /></div>
      <div className="probe-tray" />
      {step >= 3 && <div className="probe-tray-bag general-basis-probe" key={active}><SymbolicBag symbol={`v_${active + 1}`} basis /></div>}
    </div>
    {(step === 3 || step === 4) && <div className="general-basis-quote" key={active}>
      <span data-role="symbolic-quote"><MathFormula latex={`f(v_${active + 1})`} /></span><MathFormula latex={"\\,\\text{元}"} />
    </div>}
    <div className="general-basis-expansion" data-role="general-basis-expansion">
      <div className={`general-basis-result-bag ${step < 1 ? 'general-basis-hidden' : ''}`}><SymbolicBag symbol="v" /></div>
      <span className={`general-basis-equals ${step < 1 ? 'general-basis-hidden' : ''}`}><MathFormula latex="=" /></span>
      {[0, 1].map(i => <div className={`general-basis-term general-basis-term-${i}`} key={i}>
        {i === 1 && <span className={step < 1 ? 'general-basis-hidden' : ''}><MathFormula latex="+" /></span>}
        <span data-coordinate={i} className={`general-basis-coordinate ${step < 1 ? 'general-basis-hidden' : ''}`}><MathFormula latex={i === 0 ? 'a' : 'b'} /></span>
        <div className="general-basis-bag" data-basis={i}><SymbolicBag symbol={`v_${i + 1}`} basis /></div>
      </div>)}
    </div>
    <div className="general-basis-equation">
    {step >= 2 && <div className="general-basis-linearity" data-role="general-basis-linearity">
      <MathFormula latex="f(v)=" /><span className="general-basis-coordinate"><MathFormula latex="a" /></span><MathFormula latex="f(v_1)+" /><span className="general-basis-coordinate"><MathFormula latex="b" /></span><MathFormula latex="f(v_2)" />
    </div>}
    <div className={`general-basis-product ${step < 3 ? "general-basis-product-pending" : ""}`} data-role="general-basis-product">
      <span className={`general-basis-product-result ${step < 5 ? 'general-basis-hidden' : ''}`}><MathFormula latex="=" /></span>
      <span className={`general-basis-price-row ${step < 3 ? 'general-basis-hidden' : ''}`}>
        <MathFormula latex={"\\begin{bmatrix}{f(v_1)}&{f(v_2)}\\end{bmatrix}"} />
      </span>
      <span className={`general-basis-column ${step < 5 ? 'general-basis-hidden' : ''}`}><MathFormula latex={"\\begin{bmatrix}a\\\\b\\end{bmatrix}"} /></span>
    </div>
    </div>
  </section>;
}
