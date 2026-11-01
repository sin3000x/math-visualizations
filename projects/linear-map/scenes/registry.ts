import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { JuiceSpaceScene } from "./JuiceSpaceScene";
import { JuiceMapScene } from "./JuiceMapScene";
import { MachinesScene } from "./MachinesScene";
import { LinearityScene } from "./LinearityScene";
import { BasisImagesScene } from "./BasisImagesScene";
import { MatrixScene } from "./MatrixScene";
import { MatrixVectorScene } from "./MatrixVectorScene";
export const concept = defineConcept({ title: "线性映射与矩阵", conceptId: "linear-map", scenes: [
  { id: "juice-space", order: 5, title: "JuiceSpaceScene", summary: "一托盘三杯果汁是 W 的元素，托盘可以倒在一起，液面可以按倍数伸缩。", stepCount: 6, component: JuiceSpaceScene },
  { id: "juice-map", order: 10, title: "JuiceMapScene", summary: "V 中每一袋都对应 W 中的一组果汁，榨汁机是这种对应的规则。", stepCount: 5, component: JuiceMapScene },
  { id: "machines", order: 15, title: "MachinesScene", summary: "同一袋水果经过不同榨汁机，同时得到不同的果汁组合。", stepCount: 3, component: MachinesScene },
  { id: "linearity", order: 20, title: "LinearityScene", summary: "先合并或缩放再榨汁，与先榨汁再合并或缩放，结果相同。", stepCount: 8, component: LinearityScene },
  { id: "basis-images", order: 30, title: "BasisImagesScene", summary: "由线性，确定了两只基袋的结果，任意一袋的结果也就确定：袋子写成基袋的组合，托盘就是基袋托盘的同一组合。", stepCount: 8, component: BasisImagesScene },
  { id: "matrix", order: 40, title: "MatrixScene", summary: "基袋结果按列排成矩阵；列顶的水果、行首的杯子与矩阵一起表示线性映射 T，矩阵记作 [T]_{杯←果}，默认基底时简记为 T；收银台背后的行向量就是新基为 1 的 V → R 矩阵。", stepCount: 16, component: MatrixScene },
  { id: "matrix-vector", order: 50, title: "MatrixVectorScene", summary: "一袋水果的数量是矩阵各列的权重，加权和就是榨出的果汁。", stepCount: 4, component: MatrixVectorScene },
]});
