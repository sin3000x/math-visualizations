import { createSceneRegistry } from "@math-visualizations/scene-kit/registry";
import { SCENE_VIEWPORT } from "@math-visualizations/scene-kit/types";
import { DualBasisScene } from "./DualBasisScene";
export const project = { title: "对偶基", conceptId: "dual-basis" };
export const registry = createSceneRegistry([{
  id: "dual-basis-pairing", conceptId: project.conceptId, order: 10, route: "/",
  title: "DualBasisScene", summary: "两袋基水果依次经过两个基础收银台，得到对偶基的四个取值关系。",
  viewport: SCENE_VIEWPORT, stepCount: 6, component: DualBasisScene,
}]);
