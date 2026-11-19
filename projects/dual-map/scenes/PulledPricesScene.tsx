import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { Board } from "../components/Board";
import { DualMapOverlay } from "./DualMapScene";
import { PULLED_PRICES_STEPS } from "./steps";

/** 这台新水果收银台的单价：把一斤苹果、一斤香蕉分别榨汁再结账，逐杯相加，合计就是单价。 */
export function PulledPricesScene({ step }: SceneProps) {
  return <section className="lesson" data-step={step} aria-label="把两只基袋分别榨汁再结账，得到新水果收银台的单价">
    <Board {...PULLED_PRICES_STEPS[step]} />
    {step <= 1 && <div className={step === 1 ? "fade-out" : ""}><DualMapOverlay step={4} animate={false} /></div>}
  </section>;
}
