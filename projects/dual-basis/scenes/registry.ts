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
  id: "dual-basis-pairing", order: 10, title: "DualBasisScene",
  stepCount: 6, component: DualBasisScene,
}, {
  id: "dual-basis-coordinate-reading", order: 20, title: "CoordinateReadingScene",
  stepCount: 6, component: CoordinateReadingScene,
}, {
  id: "dual-basis-independence", order: 30, title: "CheckoutIndependenceScene",
  stepCount: 8, component: CheckoutIndependenceScene,
}, {
  id: "dual-basis-spanning", order: 40, title: "CheckoutSpanningScene",
  stepCount: 11, component: CheckoutSpanningScene,
}, {
  id: "dual-basis-notation", order: 50, title: "DualBasisNotationScene",
  stepCount: 9, component: DualBasisNotationScene,
}, {
  id: "dual-basis-polynomial-space", order: 60, title: "PolynomialDualSpaceScene",
  stepCount: 10, component: PolynomialDualSpaceScene,
}, {
  id: "dual-basis-lagrange", order: 70, title: "LagrangeBasisScene",
  stepCount: 11, component: LagrangeBasisScene,
}, {
  id: "dual-basis-recap", order: 80, title: "DualBasisRecapScene",
  stepCount: 3, component: DualBasisRecapScene,
}]});
