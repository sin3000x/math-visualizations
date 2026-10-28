import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { DualBasisScene } from "./DualBasisScene";
import { CoordinateReadingScene } from "./CoordinateReadingScene";
import { CheckoutIndependenceScene } from "./CheckoutIndependenceScene";
import { CheckoutSpanningScene } from "./CheckoutSpanningScene";
import { DualBasisNotationScene } from "./DualBasisNotationScene";
import { PolynomialDualSpaceScene } from "./PolynomialDualSpaceScene";
import { LagrangeBasisScene } from "./LagrangeBasisScene";
import { DualBasisRecapScene } from "./DualBasisRecapScene";
export const concept = defineConcept({ title: "对偶基", conceptId: "dual-basis", scenes: [{
  id: "dual-basis-pairing", order: 10, title: "DualBasisScene", summary: "两袋基水果依次经过两个基础收银台，得到对偶基的四个取值关系。",
  stepCount: 6, component: DualBasisScene,
}, {
  id: "dual-basis-coordinate-reading", order: 20, title: "CoordinateReadingScene", summary: "同一袋水果分别经过两个对偶基收银台，读出苹果和香蕉的斤数，再将两个读数移动为基袋线性组合的系数。",
  stepCount: 6, component: CoordinateReadingScene,
}, {
  id: "dual-basis-independence", order: 30, title: "CheckoutIndependenceScene", summary: "将两个基袋依次放到三个收银台上，从零线性组合推出两个系数都为零，证明对偶基线性无关。",
  stepCount: 8, component: CheckoutIndependenceScene,
}, {
  id: "dual-basis-spanning", order: 40, title: "CheckoutSpanningScene", summary: "从任意水果袋的基分解出发，将任意收银台写成两个对偶基收银台的线性组合，说明它们张成整个对偶空间。",
  stepCount: 11, component: CheckoutSpanningScene,
}, {
  id: "dual-basis-notation", order: 50, title: "DualBasisNotationScene", summary: "从配对条件介绍两种对偶基记号，再将基的对应线性延拓为依赖所选基的 V 到对偶空间的同构。",
  stepCount: 9, component: DualBasisNotationScene,
}, {
  id: "dual-basis-polynomial-space", order: 60, title: "PolynomialDualSpaceScene", summary: "突出单项式基，逐步用取值与导数读出三个系数，将读数代回多项式展开式，再表示积分泛函。",
  stepCount: 10, component: PolynomialDualSpaceScene,
}, {
  id: "dual-basis-lagrange", order: 70, title: "LagrangeBasisScene", summary: "以节点 -1、0、1 的小函数图像展示拉格朗日基，逐点验证取值泛函的对偶基性质，再将多项式采样读数移为展开系数。",
  stepCount: 11, component: LagrangeBasisScene,
}, {
  id: "dual-basis-recap", order: 80, title: "DualBasisRecapScene", summary: "回顾 n 个基向量及其 n 个对偶基泛函，用 1 与 0 展开配对关系，最后强调有限维前提。",
  stepCount: 3, component: DualBasisRecapScene,
}]});
