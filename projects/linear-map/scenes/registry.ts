import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { JuiceSpaceScene } from "./JuiceSpaceScene";
import { JuiceMapScene } from "./JuiceMapScene";
import { MachinesScene } from "./MachinesScene";
import { LinearityScene } from "./LinearityScene";
import { BasisImagesScene } from "./BasisImagesScene";
import { MatrixScene } from "./MatrixScene";
export const concept = defineConcept({ title: "线性映射与矩阵", conceptId: "linear-map", scenes: [
  { id: "juice-space", order: 5, title: "JuiceSpaceScene", summary: "一托盘三杯果汁是 W 的元素，托盘可以倒在一起，液面可以按倍数伸缩。", stepCount: 6, component: JuiceSpaceScene },
  { id: "juice-map", order: 10, title: "JuiceMapScene", summary: "V 中每一袋都对应 W 中的一组果汁，榨汁机是这种对应的规则。", stepCount: 5, component: JuiceMapScene },
  { id: "machines", order: 15, title: "MachinesScene", summary: "同一袋水果经过不同榨汁机，同时得到不同的果汁组合。", stepCount: 3, component: MachinesScene },
  { id: "linearity", order: 20, title: "LinearityScene", summary: "先合并或缩放再榨汁，与先榨汁再合并或缩放，结果相同。", stepCount: 9, component: LinearityScene },
  { id: "basis-images", order: 30, title: "BasisImagesScene", summary: "任意一袋都能拆成基袋的倍数，结果就是基袋托盘按倍数缩放后倒在一起。", stepCount: 7, component: BasisImagesScene },
  { id: "matrix", order: 40, title: "MatrixScene", summary: "基袋结果按列排成矩阵，水果数量是各列的权重。", stepCount: 5, component: MatrixScene },
]});
