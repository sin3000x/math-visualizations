import { createSceneRegistry } from "../lib/scenes/registry";
import { SCENE_VIEWPORT } from "../lib/scenes/types";
import { DoubleDualScene } from "./DoubleDualScene";
import { SupermarketScene } from "./SupermarketScene";
import { NaturalIdentificationScene } from "./NaturalIdentificationScene";
import { ReconstructBagScene } from "./ReconstructBagScene";
export const project = { title: "对偶的对偶", conceptId: "double-dual" };
export const registry = createSceneRegistry([{
  id: "measuring-a-measurement", conceptId: project.conceptId, order: 10, route: "/",
  title: "谁来测量收银台", summary: "回顾线性测量，再用同一袋水果揭示对收银台的测量。",
  viewport: SCENE_VIEWPORT, stepCount: 4, component: DoubleDualScene,
}, {
  id: "supermarket-price-survey", conceptId: project.conceptId, order: 20, route: "/",
  title: "换水果袋与换收银台", summary: "同一收银台测量不同水果袋，再用同一袋水果测量不同超市的收银台。",
  viewport: SCENE_VIEWPORT, stepCount: 6, component: SupermarketScene,
}, {
  id: "reconstruct-bag-from-readings", conceptId: project.conceptId, order: 30, route: "/",
  title: "从读数还原水果袋", summary: "两个坐标读数唯一确定水果袋，线性保证它对任意收银台都给出相同结果。",
  viewport: SCENE_VIEWPORT, stepCount: 8, component: ReconstructBagScene,
}, {
  id: "natural-double-dual-identification", conceptId: project.conceptId, order: 40, route: "/",
  title: "双对偶回到原空间", summary: "呼应开幕，以同一袋水果和它定义的评价泛函呈现有限维空间与双对偶的自然同构。",
  viewport: SCENE_VIEWPORT, stepCount: 4, component: NaturalIdentificationScene,
}]);
