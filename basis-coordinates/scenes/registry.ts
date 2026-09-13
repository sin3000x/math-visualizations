import { createSceneRegistry } from "../lib/scenes/registry";
import { SCENE_VIEWPORT } from "../lib/scenes/types";
import { BasisScene } from "./BasisScene";
import { CheckoutBasisScene } from "./CheckoutBasisScene";
import { CheckoutGeneralBagScene } from "./CheckoutGeneralBagScene";
import { ChangeBasisScene } from "./ChangeBasisScene";
export const project = { title: "基、坐标、行向量", conceptId: "basis-coordinates" };
export const registry = createSceneRegistry([{
  id: "fruit-bag-basis", conceptId: project.conceptId, order: 10, route: "/",
  title: "两个袋子生成整个空间", summary: "从水果袋线性空间中选出两个单位袋，展示任意袋子的线性组合，再整理为基袋行向量与坐标列向量的乘积。",
  viewport: SCENE_VIEWPORT, stepCount: 4, component: BasisScene,
}, {
  id: "checkout-basis-prices", conceptId: project.conceptId, order: 20, route: "/",
  title: "用基袋测出单价", summary: "先展示收银台的加法与数乘性质，再用两个单位袋测出隐藏的苹果和香蕉单价。",
  viewport: SCENE_VIEWPORT, stepCount: 9, component: CheckoutBasisScene,
}, {
  id: "checkout-general-bag", conceptId: project.conceptId, order: 30, route: "/",
  title: "计算任意袋子的价格", summary: "把 a 斤苹果、b 斤香蕉放上托盘，用已经测出的单价得到 5a+3b，再复制成单价行向量与坐标列向量的乘法。",
  viewport: SCENE_VIEWPORT, stepCount: 6, component: CheckoutGeneralBagScene,
}, {
  id: "change-basis-same-price", conceptId: project.conceptId, order: 40, route: "/",
  title: "换基，价格不变", summary: "先并列展示同一袋水果在原基和新基下的展开，再测出新基袋报价 8、3，两套行列乘积均得到 19。",
  viewport: SCENE_VIEWPORT, stepCount: 8, component: ChangeBasisScene,
}]);
