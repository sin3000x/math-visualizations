import { defineConcept } from "@math-visualizations/scene-kit/registry";
import { JuiceMapScene } from "./JuiceMapScene";
import { LinearityScene } from "./LinearityScene";
import { BasisImagesScene } from "./BasisImagesScene";
import { MatrixColumnsScene } from "./MatrixColumnsScene";
import { MatrixActionScene } from "./MatrixActionScene";
export const concept = defineConcept({ title: "线性映射与矩阵", conceptId: "linear-map", scenes: [
  { id: "juice-map", order: 10, title: "JuiceMapScene", summary: "同一袋水果经过不同映射得到不同果汁组合。", stepCount: 5, component: JuiceMapScene },
  { id: "linearity", order: 20, title: "LinearityScene", summary: "合并或倍增输入，输出也相应合并或倍增。", stepCount: 4, component: LinearityScene },
  { id: "basis-images", order: 30, title: "BasisImagesScene", summary: "分别观察两个水果基袋的像及其坐标。", stepCount: 4, component: BasisImagesScene },
  { id: "matrix-columns", order: 40, title: "MatrixColumnsScene", summary: "两个基袋的像的坐标按列组成三行两列矩阵。", stepCount: 4, component: MatrixColumnsScene },
  { id: "matrix-action", order: 50, title: "MatrixActionScene", summary: "矩阵乘法计算基的像的线性组合。", stepCount: 4, component: MatrixActionScene },
]});
