import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('创建项目登记 workspace、更新锁文件，并拒绝覆盖或重复包名', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'math-workspace-test-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    const template = path.join(root, 'templates/scene-project');
    await mkdir(template, { recursive: true });
    const shared = path.join(root, 'packages/scene-kit');
    await mkdir(shared, { recursive: true });
    await writeFile(path.join(shared, 'package.json'), JSON.stringify({ name: '@math-visualizations/scene-kit', version: '0.1.0', private: true, type: 'module', exports: './index.mjs' }));
    await writeFile(path.join(shared, 'index.mjs'), 'export const viewport = 1920;');
    await cp(new URL('../scripts/create-project.mjs', import.meta.url), path.join(root, 'scripts/create-project.mjs'));
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', private: true, workspaces: ['packages/scene-kit', 'templates/scene-project'] }));
    await writeFile(path.join(template, 'package.json'), JSON.stringify({ name: 'scene-project', version: '0.1.0', private: true, dependencies: { '@math-visualizations/scene-kit': '0.1.0' } }));
    await writeFile(path.join(template, 'check.mjs'), 'import assert from "node:assert/strict"; import { viewport } from "@math-visualizations/scene-kit"; assert.equal(viewport, 1920);');
    await writeFile(path.join(template, 'README.md'), '[规范](../../AGENTS.md)');
    for (const folder of ['node_modules', 'dist', 'exports']) {
      await mkdir(path.join(template, folder));
      await writeFile(path.join(template, folder, 'sentinel'), '不要复制');
    }
    const run = name => spawnSync(process.execPath, ['scripts/create-project.mjs', name], { cwd: root, encoding: 'utf8', timeout: 60_000 });
    const created = run('linear-map');
    assert.equal(created.status, 0, created.stderr);
    const manifest = JSON.parse(await readFile(path.join(root, 'package.json')));
    assert.deepEqual(manifest.workspaces, ['packages/scene-kit', 'templates/scene-project', 'linear-map']);
    const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json')));
    assert.equal(lock.packages['linear-map'].version, '0.1.0');
    assert.equal(JSON.parse(await readFile(path.join(root, 'linear-map/package.json'))).name, 'linear-map');
    assert.equal(lock.packages['node_modules/linear-map'].link, true);
    assert.equal(await readFile(path.join(root, 'linear-map/README.md'), 'utf8'), '[规范](../AGENTS.md)');
    for (const item of ['node_modules', 'dist', 'exports', 'package-lock.json']) {
      await assert.rejects(access(path.join(root, 'linear-map', item)));
    }
    const before = await readFile(path.join(root, 'package-lock.json'), 'utf8');
    for (const name of ['linear-map', 'scene-project', '../outside', 'scripts']) {
      assert.notEqual(run(name).status, 0, `必须拒绝 ${name}`);
    }
    assert.equal(await readFile(path.join(root, 'package-lock.json'), 'utf8'), before);
    const installed = spawnSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: root, encoding: 'utf8', timeout: 60_000 });
    assert.equal(installed.status, 0, installed.stderr);
    const imported = spawnSync(process.execPath, ['linear-map/check.mjs'], { cwd: root, encoding: 'utf8', timeout: 10_000 });
    assert.equal(imported.status, 0, imported.stderr);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
