import { SCENE_VIEWPORT, type SceneDefinition } from "./types.ts";

const sceneDefinitions = [
  {
    id: "DualSpaceIntroScene",
    conceptId: "dual-space-episode-1",
    order: 10,
    route: "/",
    title: "袋子的世界与收银台的世界",
    summary: "用一次选择、送入和报价，直观看见两个对象集合之间的关系。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "BagVectorSpaceScene",
    conceptId: "dual-space-episode-1",
    order: 20,
    route: "/",
    title: "袋子为什么组成线性空间",
    summary: "用购买与退货的实数重量，逐条验证袋子空间的八条线性空间公理。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "CheckoutLinearityScene",
    conceptId: "dual-space-episode-1",
    order: 25,
    route: "/",
    title: "一个收银台的线性性质",
    summary: "固定同一个收银台，观察合袋与缩放重量如何改变报价。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "CheckoutOperationsScene",
    conceptId: "dual-space-episode-1",
    order: 30,
    route: "/",
    title: "收银台的加法与数乘",
    summary: "对同一袋逐点相加、按实数缩放报价，定义新的收银台。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "CheckoutVectorSpaceScene",
    conceptId: "dual-space-episode-1",
    order: 40,
    route: "/",
    title: "收银台也组成线性空间",
    summary: "按每一袋的报价验证八条性质，认识线性收银台组成的对偶空间。",
    viewport: SCENE_VIEWPORT,
  },
  {
    id: "DualSpaceSummaryScene",
    conceptId: "dual-space-episode-1",
    order: 50,
    route: "/",
    title: "对偶空间：测量方式的集合",
    summary: "同一袋水果经过不同线性收银台得到不同读数，所有线性测量方式组成对偶空间。",
    viewport: SCENE_VIEWPORT,
  },
] as const satisfies readonly SceneDefinition[];

export function validateSceneRegistry(scenes: readonly SceneDefinition[]) {
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

export const dualSpaceIntroScene = getScene("DualSpaceIntroScene");
export const bagVectorSpaceScene = getScene("BagVectorSpaceScene");
