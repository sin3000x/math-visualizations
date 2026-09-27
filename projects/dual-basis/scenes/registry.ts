import { createSceneRegistry } from "@math-visualizations/scene-kit/registry";
import { SCENE_VIEWPORT } from "@math-visualizations/scene-kit/types";
import { DualBasisScene } from "./DualBasisScene";
import { CoordinateReadingScene } from "./CoordinateReadingScene";
import { CheckoutIndependenceScene } from "./CheckoutIndependenceScene";
import { CheckoutSpanningScene } from "./CheckoutSpanningScene";
import { DualBasisNotationScene } from "./DualBasisNotationScene";
import { PolynomialDualSpaceScene } from "./PolynomialDualSpaceScene";
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
  viewport: SCENE_VIEWPORT, stepCount: 10, component: CheckoutSpanningScene,
}, {
  id: "dual-basis-notation", conceptId: project.conceptId, order: 50, route: "/",
  title: "DualBasisNotationScene", summary: "从配对条件介绍两种对偶基记号，再将基的对应线性延拓为依赖所选基的 V 到对偶空间的同构。",
  viewport: SCENE_VIEWPORT, stepCount: 9, component: DualBasisNotationScene,
}, {
  id: "dual-basis-polynomial-space", conceptId: project.conceptId, order: 60, route: "/",
  title: "PolynomialDualSpaceScene", summary: "用具体多项式展示次数不超过二的实多项式空间，并用取值、求导和定积分展示其对偶空间中的线性泛函。",
  viewport: SCENE_VIEWPORT, stepCount: 2, component: PolynomialDualSpaceScene,
}]);
