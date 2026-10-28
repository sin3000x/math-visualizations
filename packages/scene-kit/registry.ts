import { SCENE_VIEWPORT, type SceneDefinition } from "./types.ts";

export function createSceneRegistry(definitions: readonly SceneDefinition[]) {
  const ids = new Set<string>();
  const orders = new Set<string>();
  if (!definitions.length) throw new Error("至少注册一个 Scene");
  for (const scene of definitions) {
    if (ids.has(scene.id)) throw new Error(`重复 Scene id: ${scene.id}`);
    const key = `${scene.conceptId}:${scene.order}`;
    if (orders.has(key)) throw new Error(`重复 Scene order: ${key}`);
    if (!Number.isSafeInteger(scene.stepCount) || scene.stepCount < 1) {
      throw new Error(`Scene 步骤数必须为正的安全整数: ${scene.id}`);
    }
    ids.add(scene.id);
    orders.add(key);
  }
  return {
    getConceptScenes(conceptId: string) {
      return definitions.filter(scene => scene.conceptId === conceptId)
        .sort((a, b) => a.order - b.order);
    },
  };
}

/** 一个概念中的 Scene；conceptId、route 和 viewport 由 defineConcept 统一填写。 */
export type ConceptSceneInput = Omit<SceneDefinition, "conceptId" | "route" | "viewport"> & Partial<Pick<SceneDefinition, "route">>;
export type Concept = Readonly<{ title: string; conceptId: string; scenes: readonly SceneDefinition[] }>;

/** 登记一个概念的全部 Scene，完成注册表校验并按 order 排序。 */
export function defineConcept({ title, conceptId, scenes }: { title: string; conceptId: string; scenes: readonly ConceptSceneInput[] }): Concept {
  const definitions = scenes.map(scene => ({ route: "/", ...scene, conceptId, viewport: SCENE_VIEWPORT }));
  return { title, conceptId, scenes: createSceneRegistry(definitions).getConceptScenes(conceptId) };
}
