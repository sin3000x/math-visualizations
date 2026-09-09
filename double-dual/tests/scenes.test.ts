import assert from 'node:assert/strict';
import test from 'node:test';
import { createSceneRegistry } from '../lib/scenes/registry.ts';
import { moveStep } from '../lib/scenes/navigation.ts';
import { SCENE_VIEWPORT, type SceneDefinition } from '../lib/scenes/types.ts';

const example: SceneDefinition = {
  id: 'one', conceptId: 'example', order: 10, route: '/', title: '示例', summary: '观察关系',
  viewport: SCENE_VIEWPORT, stepCount: 2, component: () => null,
};
test('registry rejects ambiguous ids, order and unusable step counts', () => {
  assert.throws(() => createSceneRegistry([]));
  assert.throws(() => createSceneRegistry([example, { ...example, order: 20 }]));
  assert.throws(() => createSceneRegistry([example, { ...example, id: 'two' }]));
  for (const stepCount of [0, -1, 1.5, 10]) {
    assert.throws(() => createSceneRegistry([{ ...example, stepCount }]));
  }
});
test('registry filters concepts and sorts without changing the input', () => {
  const definitions = [{ ...example, id: 'two', order: 20 }, example, { ...example, id: 'other', conceptId: 'other' }];
  const registry = createSceneRegistry(definitions);
  assert.deepEqual(registry.getConceptScenes('example').map(scene => scene.id), ['one', 'two']);
  assert.equal(definitions[0].id, 'two');
});
test('navigation crosses unequal scene lengths in both directions and stops at endpoints', () => {
  const counts = [2, 1, 3];
  let position = { sceneIndex: 0, step: 0 };
  const path = [{ sceneIndex: 0, step: 1 }, { sceneIndex: 1, step: 0 }, { sceneIndex: 2, step: 0 }, { sceneIndex: 2, step: 1 }, { sceneIndex: 2, step: 2 }];
  assert.deepEqual(moveStep(counts, position, -1), position);
  for (const expected of path) {
    position = moveStep(counts, position, 1);
    assert.deepEqual(position, expected);
  }
  assert.deepEqual(moveStep(counts, position, 1), position);
  for (const expected of [...path.slice(0, -1).reverse(), { sceneIndex: 0, step: 0 }]) {
    position = moveStep(counts, position, -1);
    assert.deepEqual(position, expected);
  }
});
