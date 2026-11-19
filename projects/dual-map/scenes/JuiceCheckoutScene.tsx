import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { Board } from "../components/Board";
import { JUICE_CHECKOUT_STEPS } from "./steps";

/** 果汁收银台：水果收银台给一袋水果结账，果汁收银台给一托盘三杯果汁结账。步骤见 steps.ts。 */
export function JuiceCheckoutScene({ step }: SceneProps) {
  return <section className="lesson" data-step={step} aria-label="水果收银台给一袋水果结账，果汁收银台给一托盘果汁结账">
    <Board {...JUICE_CHECKOUT_STEPS[step]} />
  </section>;
}
