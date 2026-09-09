import { createSceneRegistry } from "../lib/scenes/registry";
import { SCENE_VIEWPORT } from "../lib/scenes/types";
import { DoubleDualScene } from "./DoubleDualScene";
export const project = { title: "对偶的对偶", conceptId: "double-dual" };
export const registry = createSceneRegistry([{
  id: "measuring-a-measurement", conceptId: project.conceptId, order: 10, route: "/",
  title: "谁来测量收银台", summary: "回顾线性测量，再用同一袋水果揭示对收银台的测量。",
  viewport: SCENE_VIEWPORT, stepCount: 4, component: DoubleDualScene,
}]);
