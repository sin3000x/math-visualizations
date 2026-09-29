import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('完整检查只构建一次，根目录和 KKT 的独立测试仍先构建', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'math-check-test-'));
  try {
    const rootManifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    const kktManifest = JSON.parse(await readFile(new URL('../projects/kkt-conditions/package.json', import.meta.url), 'utf8'));
    const project = path.join(root, 'projects/kkt-conditions');
    await mkdir(project, { recursive: true });
    await mkdir(path.join(root, 'tests'));
    await writeFile(path.join(root, 'package.json'), JSON.stringify({
      name: 'check-fixture',
      private: true,
      type: 'module',
      workspaces: ['projects/kkt-conditions'],
      scripts: rootManifest.scripts,
    }));
    await writeFile(path.join(project, 'package.json'), JSON.stringify({
      name: 'kkt-conditions',
      private: true,
      type: 'module',
      scripts: {
        lint: 'node ../../record.mjs lint',
        build: 'node ../../record.mjs build',
        pretest: kktManifest.scripts.pretest,
        test: 'node ../../record.mjs workspace-test',
      },
    }));
    await writeFile(path.join(root, 'record.mjs'), [
      "import { appendFileSync } from 'node:fs';",
      "appendFileSync(new URL('./events.txt', import.meta.url), process.argv[2] + '\\n');",
    ].join('\n'));
    await writeFile(path.join(root, 'tests/smoke.test.mjs'), [
      "import { appendFileSync } from 'node:fs';",
      "appendFileSync(new URL('../events.txt', import.meta.url), 'root-test\\n');",
    ].join('\n'));

    for (const [cwd, args, expected] of [
      [root, ['run', 'check'], ['lint', 'build', 'root-test', 'workspace-test']],
      [root, ['test'], ['root-test', 'build', 'workspace-test']],
      [project, ['test'], ['build', 'workspace-test']],
    ]) {
      await writeFile(path.join(root, 'events.txt'), '');
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT;
      const result = spawnSync('npm', args, { cwd, env, encoding: 'utf8', timeout: 30_000 });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const events = (await readFile(path.join(root, 'events.txt'), 'utf8')).trim().split('\n');
      assert.deepEqual(events, expected, `${cwd}: npm ${args.join(' ')}`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
