import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { Board } from "../components/Board";
import { TWO_WAYS_STEPS } from "./steps";

/** 检验：一袋 (2,1) 先榨汁再结账是 16 元，按 5、6 元/斤直接结账也是 16 元，两条路一致。 */
export function TwoWaysScene({ step }: SceneProps) {
  return <section className="lesson" data-step={step} aria-label="同一袋水果先榨汁再结账，与按翻译出的单价直接结账，价格一致">
    <Board {...TWO_WAYS_STEPS[step]} />
  </section>;
}
