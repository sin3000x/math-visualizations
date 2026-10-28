import { useId } from "react";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import type { Juice as Quantities } from "../lib/math/map";
import "./Juice.css";
const names = ["A 果汁", "B 果汁", "C 果汁"];
const colors = ["#62d2c3", "#73a7ef", "#ba91ef"];
export function Juice({ values, labels = false }: { values: Quantities; labels?: boolean }) {
  const id = useId();
  return <div className="juice-set" data-role="juice" data-values={values.join(",")}>
    {values.map((value, i) => <div className="juice-item" key={i} style={{ color: colors[i] }}>
      <svg viewBox="0 0 90 140" aria-label={`${names[i]}：${value} 个产量单位`}>
        <defs><clipPath id={`cup-${id}-${i}`}><path d="M15 12 H75 L67 128 Q45 136 23 128 Z" /></clipPath></defs>
        <g clipPath={`url(#cup-${id}-${i})`}><rect className="juice-liquid" x="12" y={130 - Math.abs(value) * 12} width="66" height={Math.abs(value) * 12} fill="currentColor" fillOpacity=".55" /></g>
        <path d="M15 12 H75 L67 128 Q45 136 23 128 Z" fill="none" stroke="currentColor" strokeWidth="3.5" />
      </svg>
      <MathFormula latex={String(value)} />
      {labels && <><span className="juice-name">{names[i]}</span><MathFormula latex={`u_${i + 1}`} /></>}
    </div>)}
  </div>;
}
