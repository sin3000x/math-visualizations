export const SCENE_VIEWPORT = { width: 1920, height: 1080 } as const;

export type SceneDefinition = Readonly<{
  id: string;
  conceptId: string;
  order: number;
  route: string;
  title: string;
  summary: string;
  viewport: Readonly<{ width: 1920; height: 1080 }>;
}>;
