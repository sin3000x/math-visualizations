import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { JuiceSpaceScene } from "./JuiceSpaceScene";
import { JuiceMapScene } from "./JuiceMapScene";
import { MachinesScene } from "./MachinesScene";
import { LinearityScene } from "./LinearityScene";
import { BasisImagesScene } from "./BasisImagesScene";
import { MatrixScene } from "./MatrixScene";
import { MatrixVectorScene } from "./MatrixVectorScene";
import { TakeawayScene } from "./TakeawayScene";
export const concept = defineConcept({ title: "线性映射与矩阵", conceptId: "linear-map", scenes: [
  { id: "juice-space", order: 5, title: "JuiceSpaceScene", stepCount: 6, component: JuiceSpaceScene },
  { id: "juice-map", order: 10, title: "JuiceMapScene", stepCount: 5, component: JuiceMapScene },
  { id: "machines", order: 15, title: "MachinesScene", stepCount: 3, component: MachinesScene },
  { id: "linearity", order: 20, title: "LinearityScene", stepCount: 8, component: LinearityScene },
  { id: "basis-images", order: 30, title: "BasisImagesScene", stepCount: 8, component: BasisImagesScene },
  { id: "matrix", order: 40, title: "MatrixScene", stepCount: 18, component: MatrixScene },
  { id: "matrix-vector", order: 50, title: "MatrixVectorScene", stepCount: 7, component: MatrixVectorScene },
  { id: "takeaway", order: 60, title: "TakeawayScene", stepCount: 5, component: TakeawayScene },
]});
