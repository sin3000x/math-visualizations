import type { Position } from "./navigation.ts";

type LinkScene = Readonly<{ id: string; stepCount: number }>;

/** URL steps are one-based; scene state remains zero-based. */
export function positionFromSearch(scenes: readonly LinkScene[], search: string): Position {
  const params = new URLSearchParams(search);
  const sceneIndex = Math.max(0, scenes.findIndex(scene => scene.id === params.get("scene")));
  const requested = params.get("step") ?? "1";
  const numeric = /^\d+$/.test(requested) ? Number(requested) : NaN;
  const step = Number.isSafeInteger(numeric)
    ? Math.max(0, Math.min(numeric - 1, scenes[sceneIndex].stepCount - 1))
    : 0;
  return { sceneIndex, step };
}

export function createSceneLink(href: string, sceneId: string, step: number): string {
  const url = new URL(href);
  url.searchParams.set("scene", sceneId);
  url.searchParams.set("step", String(step + 1));
  url.searchParams.delete("export");
  return url.href;
}
