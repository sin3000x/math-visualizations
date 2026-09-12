import { createSceneRegistry } from "../lib/scenes/registry";
import { SCENE_VIEWPORT } from "../lib/scenes/types";
import { BasisScene } from "./BasisScene";
import { CheckoutBasisScene } from "./CheckoutBasisScene";
export const project = { title: "基、坐标、行向量", conceptId: "basis-coordinates" };
export const registry = createSceneRegistry([{
  id: "fruit-bag-basis", conceptId: project.conceptId, order: 10, route: "/",
  title: "两个袋子生成整个空间", summary: "从水果袋线性空间中选出两个单位袋，展示任意袋子的线性组合，再整理为基袋行向量与坐标列向量的乘积。",
  viewport: SCENE_VIEWPORT, stepCount: 4, component: BasisScene,
}, {
  id: "checkout-basis-prices", conceptId: project.conceptId, order: 20, route: "/",
  title: "用基袋测出单价", summary: "先展示收银台的加法与数乘性质，再用两个单位袋测出隐藏的苹果和香蕉单价。",
  viewport: SCENE_VIEWPORT, stepCount: 9, component: CheckoutBasisScene,
}]);
