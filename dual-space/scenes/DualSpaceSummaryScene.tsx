import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "../components/MathFormula";
import { checkouts } from "../lib/model/market";
import { quote } from "../lib/model/checkoutSpace";
import { FruitBag } from "./FruitBag";
import "./DualSpaceSummaryScene.css";

const bag = { apples: 2, bananas: 1 };
const measurements = checkouts.slice(0, 3);

export function DualSpaceSummaryScene() {
  return <section className="axiom-canvas dual-summary" aria-label="对偶空间是所有线性测量方式的集合，三个收银台只是其中的例子">
    <div className="summary-input-title">同一个对象<MathFormula latex="x" /></div>
    <div className="summary-set-title">对偶空间<MathFormula latex={"V^*"} /></div>
    <div className="summary-output-title">读数</div>
    <div className="summary-measurement-set" data-role="measurement-set">
      <span className="summary-set-caption">所有线性测量方式</span>
      <span className="summary-more"><MathFormula latex={"\\vdots"} /></span>
    </div>
    <div className="summary-bag"><FruitBag {...bag} /></div>
    <svg className="summary-arrows" viewBox="0 0 1440 810" aria-hidden="true">
      <defs><marker id="summary-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M2 2 10 6 2 10" fill="none" stroke="context-stroke" strokeWidth="1.8" /></marker></defs>
      {measurements.map((measurement, index) => {
        const y = 280 + index * 155;
        return <g key={measurement.id} stroke="#fff" fill="none" strokeWidth="3" markerEnd="url(#summary-arrow)">
          <path d={`M430 435 C510 435 510 ${y} 634 ${y}`} />
          <path d={`M810 ${y} H1050`} />
        </g>;
      })}
    </svg>
    {measurements.map((measurement, index) => <div key={measurement.id} className="summary-measurement" style={{ top: 280 + index * 155, color: measurement.accent }}>
      <div className="summary-counter" aria-label={measurement.name}><CheckoutIcon accent={measurement.accent} /></div>
      <div className="summary-reading" data-role="measurement-reading"><MathFormula latex={String(quote(measurement, bag))} /></div>
    </div>)}
  </section>;
}
