import assert from 'node:assert/strict';
import test from 'node:test';
import { createTimeline } from '../timeline.mjs';
import { renderVideo } from '../render.mjs';

test('注册表决定步骤顺序，场景尾停留与逐步覆盖互不混淆', () => {
  const scenes = [{ id: 'first', stepCount: 2 }, { id: 'second', stepCount: 1 }];
  assert.deepEqual(createTimeline(scenes, { stepSeconds: 3, sceneEndSeconds: 4, overrides: { first: [5] } }), [
    { scene: 'first', step: 0, action: 'start', seconds: 5 },
    { scene: 'first', step: 1, action: 'next', seconds: 4 },
    { scene: 'second', step: 0, action: 'next', seconds: 4 },
  ]);
});

test('拒绝无效停留时间', () => {
  for (const seconds of [0, -1, NaN, Infinity]) {
    assert.throws(() => createTimeline([{ id: 'one', stepCount: 1 }], { stepSeconds: 3, sceneEndSeconds: 4, overrides: { one: [seconds] } }), /无效停留时间/);
  }
});

test('正式导出禁止限时截断；固定编排不接受自动停留参数', async () => {
  const input = { root: '/does-not-exist' };
  await assert.rejects(renderVideo(input, ['--preset', 'production', '--limit-seconds', '1']), /仅可用于 debug/);
  await assert.rejects(renderVideo(input, ['--limit-seconds', 'Infinity']), /有限正数/);
  await assert.rejects(renderVideo(input, ['--hold-seconds=-1']), /有限正数/);
  await assert.rejects(renderVideo(input, ['--preset', '__proto__']), /预设必须/);
  await assert.rejects(renderVideo({ ...input, scriptedTimeline: [] }, ['--hold-seconds', '3']), /固定时间线/);
});
