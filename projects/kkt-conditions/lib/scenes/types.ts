export const SCENE_VIEWPORT = {
  width: 1920,
  height: 1080,
} as const;

export type SceneViewport = Readonly<{
  width: number;
  height: number;
}>;

/**
 * A Scene is one self-contained screen in a concept explanation.
 *
 * `id` is stable and is used for references. `order` is intentionally
 * separate so scenes can be rearranged without changing their identities.
 */
export type SceneDefinition = Readonly<{
  id: string;
  conceptId: string;
  order: number;
  route: string;
  title: string;
  summary: string;
  viewport: SceneViewport;
}>;
