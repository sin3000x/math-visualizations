import assert from 'node:assert/strict';
import test from 'node:test';
import { visualWorkspaces } from '../scripts/check-visual.mjs';

test('视觉检查覆盖所有登记了布局或录屏检查的主题，并先跑布局再跑录屏', async () => {
  const workspaces = await visualWorkspaces();
  const names = workspaces.map(workspace => workspace.name);
  for (const name of ['double-dual', 'basis-coordinates', 'dual-basis', 'linear-map', 'scene-project']) assert(names.includes(name), name);
  for (const workspace of workspaces) {
    assert(workspace.scripts.length > 0);
    if (workspace.scripts.length === 2) assert.deepEqual(workspace.scripts, ['check:layout', 'video:check']);
  }
});
