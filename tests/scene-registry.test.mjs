import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

// 使用 ScenePlayer 的主题：Scene 显示名称必须与组件源文件名一致（AGENTS.md §3.2、§4）。
const repository = new URL('../', import.meta.url);
const roots = [
  ...(await readdir(new URL('projects/', repository))).map(name => `projects/${name}`),
  'templates/scene-project',
];
const registries = [];
for (const root of roots) {
  const file = path.join(root, 'scenes/registry.ts');
  try { await access(new URL(file, repository)); registries.push(file); } catch { /* 无标准注册表的历史主题 */ }
}

test('至少检查模板和一个主题的注册表', () => {
  assert(registries.includes('templates/scene-project/scenes/registry.ts'));
  assert(registries.length >= 2);
});

for (const file of registries) {
  test(`${file}：Scene 标题与源文件名一致`, async () => {
    const source = await readFile(new URL(file, repository), 'utf8');
    const imports = new Map([...source.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*"\.\/(\w+)"/g)].map(([, name, module]) => [name, module]));
    const entries = [...source.matchAll(/title:\s*"([^"]*)"[^{}]*?component:\s*(\w+)/gs)];
    assert(entries.length > 0, '未找到 Scene 登记');
    for (const [, title, component] of entries) {
      assert.equal(title, imports.get(component), `${component} 的标题应为源文件名`);
    }
  });
}
