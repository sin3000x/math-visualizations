import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { BasisScene } from "./BasisScene";
import { CheckoutBasisScene } from "./CheckoutBasisScene";
import { CheckoutGeneralBagScene } from "./CheckoutGeneralBagScene";
import { ChangeBasisScene } from "./ChangeBasisScene";
import { GeneralBasisScene } from "./GeneralBasisScene";
export const concept = defineConcept({ title: "基、坐标、行向量", conceptId: "basis-coordinates", scenes: [{
  id: "fruit-bag-basis", order: 10, title: "BasisScene", summary: "从水果袋线性空间中选出两个单位袋，展示任意袋子的线性组合，再整理为基袋行向量与坐标列向量的乘积。",
  stepCount: 4, component: BasisScene,
}, {
  id: "checkout-basis-prices", order: 20, title: "CheckoutBasisScene", summary: "先展示收银台的加法与数乘性质，再用两个单位袋测出隐藏的苹果和香蕉单价。",
  stepCount: 9, component: CheckoutBasisScene,
}, {
  id: "checkout-general-bag", order: 30, title: "CheckoutGeneralBagScene", summary: "把 a 斤苹果、b 斤香蕉放上托盘，用已经测出的单价得到 5a+3b，再复制成单价行向量与坐标列向量的乘法。",
  stepCount: 6, component: CheckoutGeneralBagScene,
}, {
  id: "change-basis-same-price", order: 40, title: "ChangeBasisScene", summary: "先并列展示同一袋水果在原基和新基下的展开，再测出新基袋报价 8、3，两套行列乘积均得到 19。",
  stepCount: 8, component: ChangeBasisScene,
}, {
  id: "general-basis-checkout-row", order: 50, title: "GeneralBasisScene", summary: "对任意一组有序基，先展开 v=a v1+b v2，再用线性性计算价格，逐个把基袋结账结果填入行向量，最后配上坐标列。",
  stepCount: 6, component: GeneralBasisScene,
}]});
