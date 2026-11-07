import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { ObservationScene } from "./ObservationScene";
import { RuleScene } from "./RuleScene";

export const concept = defineConcept({ title: "数学可视化", conceptId: "scaling", scenes: [
  {
    id: "observe-scaling", order: 10, title: "ObservationScene",
    stepCount: 2, component: ObservationScene,
  },
  {
    id: "name-scaling", order: 20, title: "RuleScene",
    stepCount: 1, component: RuleScene,
  },
]});
