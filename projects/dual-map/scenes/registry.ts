import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { JuiceCheckoutScene } from "./JuiceCheckoutScene";
import { NoPushforwardScene } from "./NoPushforwardScene";
import { PullbackScene } from "./PullbackScene";
import { DualMapScene } from "./DualMapScene";
import { PulledPricesScene } from "./PulledPricesScene";
import { TwoWaysScene } from "./TwoWaysScene";
import { ContravariantScene } from "./ContravariantScene";

export const concept = defineConcept({ title: "对偶映射", conceptId: "dual-map", scenes: [
  { id: "juice-checkout", order: 10, title: "JuiceCheckoutScene", stepCount: 4, component: JuiceCheckoutScene },
  { id: "no-pushforward", order: 20, title: "NoPushforwardScene", stepCount: 5, component: NoPushforwardScene },
  { id: "pullback", order: 30, title: "PullbackScene", stepCount: 7, component: PullbackScene },
  { id: "dual-map", order: 40, title: "DualMapScene", stepCount: 5, component: DualMapScene },
  { id: "pulled-prices", order: 50, title: "PulledPricesScene", stepCount: 8, component: PulledPricesScene },
  { id: "two-ways", order: 60, title: "TwoWaysScene", stepCount: 4, component: TwoWaysScene },
  { id: "contravariant", order: 70, title: "ContravariantScene", stepCount: 4, component: ContravariantScene },
]});
