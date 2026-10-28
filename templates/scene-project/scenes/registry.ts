import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { ObservationScene } from "./ObservationScene";
import { RuleScene } from "./RuleScene";

export const concept = defineConcept({ title: "数学可视化", conceptId: "scaling", scenes: [
  {
    id: "observe-scaling", order: 10, title: "ObservationScene", summary: "比较一段线段和它的两倍长度。",
    stepCount: 2, component: ObservationScene,
  },
  {
    id: "name-scaling", order: 20, title: "RuleScene", summary: "把长度加倍写成数乘。",
    stepCount: 1, component: RuleScene,
  },
]});
