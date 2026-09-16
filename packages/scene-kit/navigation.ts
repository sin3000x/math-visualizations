export type Position = Readonly<{ sceneIndex: number; step: number }>;

export function moveStep(counts: readonly number[], position: Position, direction: 1 | -1): Position {
  const { sceneIndex, step } = position;
  const next = step + direction;
  if (next >= 0 && next < counts[sceneIndex]) return { sceneIndex, step: next };
  const nextScene = sceneIndex + direction;
  if (nextScene < 0 || nextScene >= counts.length) return position;
  return { sceneIndex: nextScene, step: direction === 1 ? 0 : counts[nextScene] - 1 };
}
