import { createSceneRegistry } from "../lib/scenes/registry";
import { SCENE_VIEWPORT } from "../lib/scenes/types";
import { BasisScene } from "./BasisScene";
export const project = { title: "基、坐标、行向量", conceptId: "basis-coordinates" };
export const registry = createSceneRegistry([{
  id: "fruit-bag-basis", conceptId: project.conceptId, order: 10, route: "/",
  title: "两个袋子生成整个空间", summary: "从水果袋线性空间中选出两个单位袋，直接展示任意袋子的线性组合。",
  viewport: SCENE_VIEWPORT, stepCount: 3, component: BasisScene,
}]);
