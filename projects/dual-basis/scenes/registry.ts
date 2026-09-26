import { createSceneRegistry } from "@math-visualizations/scene-kit/registry";
import { SCENE_VIEWPORT } from "@math-visualizations/scene-kit/types";
import { DualBasisScene } from "./DualBasisScene";
import { CoordinateReadingScene } from "./CoordinateReadingScene";
import { CheckoutIndependenceScene } from "./CheckoutIndependenceScene";
import { CheckoutSpanningScene } from "./CheckoutSpanningScene";
export const project = { title: "对偶基", conceptId: "dual-basis" };
export const registry = createSceneRegistry([{
  id: "dual-basis-pairing", conceptId: project.conceptId, order: 10, route: "/",
  title: "DualBasisScene", summary: "两袋基水果依次经过两个基础收银台，得到对偶基的四个取值关系。",
  viewport: SCENE_VIEWPORT, stepCount: 6, component: DualBasisScene,
}, {
  id: "dual-basis-coordinate-reading", conceptId: project.conceptId, order: 20, route: "/",
  title: "CoordinateReadingScene", summary: "同一袋水果分别经过两个对偶基收银台，读出苹果和香蕉的斤数，再将两个读数移动为基袋线性组合的系数。",
  viewport: SCENE_VIEWPORT, stepCount: 6, component: CoordinateReadingScene,
}, {
  id: "dual-basis-independence", conceptId: project.conceptId, order: 30, route: "/",
  title: "CheckoutIndependenceScene", summary: "将两个基袋依次放到三个收银台上，从零线性组合推出两个系数都为零，证明对偶基线性无关。",
  viewport: SCENE_VIEWPORT, stepCount: 8, component: CheckoutIndependenceScene,
}, {
  id: "dual-basis-spanning", conceptId: project.conceptId, order: 40, route: "/",
  title: "CheckoutSpanningScene", summary: "从任意水果袋的基分解出发，将任意收银台写成两个对偶基收银台的线性组合，说明它们张成整个对偶空间。",
  viewport: SCENE_VIEWPORT, stepCount: 9, component: CheckoutSpanningScene,
}]);
