import { createSceneRegistry } from "@math-visualizations/scene-kit/registry";
import { SCENE_VIEWPORT } from "@math-visualizations/scene-kit/types";
import { ObservationScene } from "./ObservationScene";
import { RuleScene } from "./RuleScene";

export const project = { title: "数学可视化", conceptId: "scaling" };

export const registry = createSceneRegistry([
  {
    id: "observe-scaling", conceptId: project.conceptId, order: 10, route: "/",
    title: "ObservationScene", summary: "比较一段线段和它的两倍长度。",
    viewport: SCENE_VIEWPORT, stepCount: 2, component: ObservationScene,
  },
  {
    id: "name-scaling", conceptId: project.conceptId, order: 20, route: "/",
    title: "RuleScene", summary: "把长度加倍写成数乘。",
    viewport: SCENE_VIEWPORT, stepCount: 1, component: RuleScene,
  },
]);
