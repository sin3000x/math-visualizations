import type { SceneDefinition } from "./types.ts";

export function createSceneRegistry(definitions: readonly SceneDefinition[]) {
  const ids = new Set<string>();
  const orders = new Set<string>();
  if (!definitions.length) throw new Error("至少注册一个 Scene");
  for (const scene of definitions) {
    if (ids.has(scene.id)) throw new Error(`重复 Scene id: ${scene.id}`);
    const key = `${scene.conceptId}:${scene.order}`;
    if (orders.has(key)) throw new Error(`重复 Scene order: ${key}`);
    if (!Number.isInteger(scene.stepCount) || scene.stepCount < 1 || scene.stepCount > 9) {
      throw new Error(`Scene 步骤数必须为 1 到 9: ${scene.id}`);
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
