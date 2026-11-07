import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { BasisScene } from "./BasisScene";
import { CheckoutBasisScene } from "./CheckoutBasisScene";
import { CheckoutGeneralBagScene } from "./CheckoutGeneralBagScene";
import { ChangeBasisScene } from "./ChangeBasisScene";
import { GeneralBasisScene } from "./GeneralBasisScene";
export const concept = defineConcept({ title: "基、坐标、行向量", conceptId: "basis-coordinates", scenes: [{
  id: "fruit-bag-basis", order: 10, title: "BasisScene",
  stepCount: 4, component: BasisScene,
}, {
  id: "checkout-basis-prices", order: 20, title: "CheckoutBasisScene",
  stepCount: 9, component: CheckoutBasisScene,
}, {
  id: "checkout-general-bag", order: 30, title: "CheckoutGeneralBagScene",
  stepCount: 6, component: CheckoutGeneralBagScene,
}, {
  id: "change-basis-same-price", order: 40, title: "ChangeBasisScene",
  stepCount: 8, component: ChangeBasisScene,
}, {
  id: "general-basis-checkout-row", order: 50, title: "GeneralBasisScene",
  stepCount: 6, component: GeneralBasisScene,
}]});
