import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { DoubleDualScene } from "./DoubleDualScene";
import { SupermarketScene } from "./SupermarketScene";
import { NaturalIdentificationScene } from "./NaturalIdentificationScene";
import { ReconstructBagScene } from "./ReconstructBagScene";
export const concept = defineConcept({ title: "对偶的对偶", conceptId: "double-dual", scenes: [{
  id: "measuring-a-measurement", order: 10, title: "DoubleDualScene",
  stepCount: 4, component: DoubleDualScene,
}, {
  id: "supermarket-price-survey", order: 20, title: "SupermarketScene",
  stepCount: 6, component: SupermarketScene,
}, {
  id: "reconstruct-bag-from-readings", order: 30, title: "ReconstructBagScene",
  stepCount: 8, component: ReconstructBagScene,
}, {
  id: "natural-double-dual-identification", order: 40, title: "NaturalIdentificationScene",
  stepCount: 4, component: NaturalIdentificationScene,
}]});
