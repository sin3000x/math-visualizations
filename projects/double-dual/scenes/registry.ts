import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { DoubleDualScene } from "./DoubleDualScene";
import { SupermarketScene } from "./SupermarketScene";
import { NaturalIdentificationScene } from "./NaturalIdentificationScene";
import { ReconstructBagScene } from "./ReconstructBagScene";
export const concept = defineConcept({ title: "对偶的对偶", conceptId: "double-dual", scenes: [{
  id: "measuring-a-measurement", order: 10, title: "DoubleDualScene", summary: "回顾线性测量，再用同一袋水果揭示对收银台的测量。",
  stepCount: 4, component: DoubleDualScene,
}, {
  id: "supermarket-price-survey", order: 20, title: "SupermarketScene", summary: "同一收银台测量不同水果袋，再用同一袋水果测量不同超市的收银台。",
  stepCount: 6, component: SupermarketScene,
}, {
  id: "reconstruct-bag-from-readings", order: 30, title: "ReconstructBagScene", summary: "两个坐标读数唯一确定水果袋，线性保证它对任意收银台都给出相同结果。",
  stepCount: 8, component: ReconstructBagScene,
}, {
  id: "natural-double-dual-identification", order: 40, title: "NaturalIdentificationScene", summary: "呼应开幕，以同一袋水果和它定义的评价泛函呈现有限维空间与双对偶的自然同构。",
  stepCount: 4, component: NaturalIdentificationScene,
}]});
