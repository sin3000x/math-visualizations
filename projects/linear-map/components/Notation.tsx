import { JuicerIcon } from "@math-visualizations/scene-kit/JuicerIcon";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import "./Notation.css";
export function Formula({ latex, className = "" }: { latex: string; className?: string }) {
  return <div data-layout-content className={`formula ${className}`}><MathFormula latex={latex} /></div>;
}
export function MapArrow({ className = "map-arrow", vertical = false }: { className?: string; vertical?: boolean }) {
  return <div className={`juicer-map ${className}`} data-layout-content>
    <JuicerIcon />
    <svg className="flow-arrow" viewBox={vertical ? "0 0 40 40" : "0 0 240 40"} aria-hidden="true">
      <path d={vertical ? "M20 2V33M7 22 20 35 33 22" : "M4 20H224M204 5L225 20 204 35"} fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  </div>;
}
