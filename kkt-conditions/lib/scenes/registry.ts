import { SCENE_VIEWPORT, type SceneDefinition } from "./types";

const sceneDefinitions = [
  {
    id: "kkt-force-balance",
    conceptId: "kkt-conditions",
    order: 10,
    route: "/",
    title: "当下降方向撞上边界",
    summary: "把 KKT 条件看成一场力的平衡。拖动粒子，亲手感受“可行”如何改变最优。",
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

export const currentScene = getScene("kkt-force-balance");
