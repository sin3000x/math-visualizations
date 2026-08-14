import { SCENE_VIEWPORT, type SceneDefinition } from "./types";

const sceneDefinitions = [
  {
    id: "gradient-contour-primer",
    conceptId: "kkt-conditions",
    order: 10,
    route: "/",
    title: "先看懂等高线与梯度",
    summary: "拖动粒子，观察函数值、梯度与等高线如何一起变化，为理解后面的 KKT 力学图景做好准备。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "kkt-force-balance",
    conceptId: "kkt-conditions",
    order: 20,
    route: "/",
    title: "当下降方向撞上边界",
    summary: "把 KKT 条件看成一场力的平衡。拖动粒子，亲手感受“可行”如何改变最优。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "kkt-conditions-assembly",
    conceptId: "kkt-conditions",
    order: 30,
    route: "/",
    title: "把力学图景写成 KKT 条件",
    summary: "从不等式约束开始，逐项组装可行性、互补松弛与驻点条件，最后再加入等式约束。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "kkt-worked-example",
    conceptId: "kkt-conditions",
    order: 40,
    route: "/",
    title: "手算一个完整的 KKT 例题",
    summary: "同时处理一个不等式约束和一个等式约束，从降维、确定可行区间到求出最优点与两个乘子。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "kkt-constraint-qualifications",
    conceptId: "kkt-conditions",
    order: 50,
    route: "/",
    title: "KKT 之前，先检查约束资格",
    summary: "用法向量、共同内移方向和严格内点，直观看懂 LICQ、MFCQ 与 Slater 条件。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "kkt-summary",
    conceptId: "kkt-conditions",
    order: 60,
    route: "/",
    title: "最后带走这三句话",
    summary: "用几何意义、必要性与充分性收束整套 KKT 逻辑，并说明非凸问题中 KKT 点只是候选点。",
    viewport: SCENE_VIEWPORT,
  },
] as const satisfies readonly SceneDefinition[];

function validateSceneRegistry(scenes: readonly SceneDefinition[]) {
  const ids = new Set<string>();
  const conceptOrders = new Set<string>();

  for (const scene of scenes) {
    if (ids.has(scene.id)) throw new Error(`Duplicate scene id: ${scene.id}`);
    ids.add(scene.id);

    const orderKey = `${scene.conceptId}:${scene.order}`;
    if (conceptOrders.has(orderKey)) {
      throw new Error(`Duplicate scene order in concept: ${orderKey}`);
    }
    conceptOrders.add(orderKey);
  }
}

validateSceneRegistry(sceneDefinitions);

export type SceneId = (typeof sceneDefinitions)[number]["id"];

export const scenes: readonly SceneDefinition[] = sceneDefinitions;

export function getScene(id: SceneId): SceneDefinition {
  const scene = scenes.find((candidate) => candidate.id === id);
  if (!scene) throw new Error(`Unknown scene: ${id}`);
  return scene;
}

export function getConceptScenes(conceptId: string): SceneDefinition[] {
  return scenes
    .filter((scene) => scene.conceptId === conceptId)
    .sort((left, right) => left.order - right.order);
}

export const gradientContourScene = getScene("gradient-contour-primer");
export const forceBalanceScene = getScene("kkt-force-balance");
export const conditionsAssemblyScene = getScene("kkt-conditions-assembly");
export const workedExampleScene = getScene("kkt-worked-example");
export const constraintQualificationsScene = getScene("kkt-constraint-qualifications");
export const summaryScene = getScene("kkt-summary");
