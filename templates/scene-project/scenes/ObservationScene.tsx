import { SvgFormula } from "../components/SvgFormula";
import type { SceneProps } from "../lib/scenes/types";

export function ObservationScene({ step }: SceneProps) {
  return <section className="example-scene" aria-label="长度加倍的直观关系">
    <p>从同一起点，观察线段的长度</p>
    <svg viewBox="0 0 1200 440" role="img" aria-label={step === 0 ? "长度为二的线段" : "长度为二和四的线段"}>
      <line x1="200" y1="120" x2="500" y2="120" stroke="var(--yellow)" strokeWidth="12" />
      <SvgFormula x={230} y={140} latex="2" />
      {step === 1 && <>
        <line x1="200" y1="300" x2="800" y2="300" stroke="var(--cyan)" strokeWidth="12" />
        <SvgFormula x={380} y={320} latex="4" />
      </>}
    </svg>
  </section>;
}
