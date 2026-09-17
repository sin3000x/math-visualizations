#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const name = process.argv[2];
if (process.argv.length !== 3 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name ?? '')) {
  console.error('用法：node scripts/create-project.mjs <小写英文项目名，例如 linear-map>');
  process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const workspace = `projects/${name}`;
const target = path.join(root, workspace);
const manifestPath = path.join(root, 'package.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const packageNames = await Promise.all(manifest.workspaces.map(async workspace =>
  JSON.parse(await readFile(path.join(root, workspace, 'package.json'), 'utf8')).name));
if ([manifest.name, ...packageNames].includes(name)) {
  console.error(`包名已存在，未创建：${name}`);
  process.exit(1);
}
try {
  // 不覆盖已有目录，包括已有子项目。
  await mkdir(path.join(root, 'projects'), { recursive: true });
  await mkdir(target);
} catch (error) {
  console.error(error.code === 'EEXIST' ? `目录已存在，未覆盖：${target}` : error.message);
  process.exit(1);
}
try {
  await cp(path.join(root, 'templates/scene-project'), target, {
    recursive: true,
    filter: source => !['node_modules', 'dist', 'exports', '.DS_Store', 'package-lock.json'].includes(path.basename(source)) && !source.endsWith('.tsbuildinfo'),
  });
  const filename = path.join(target, 'package.json');
  const data = JSON.parse(await readFile(filename, 'utf8'));
  data.name = name;
  await writeFile(filename, `${JSON.stringify(data, null, 2)}\n`);
  manifest.workspaces.push(workspace);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const result = spawnSync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    throw new Error('项目已登记，但根锁文件更新失败。请在仓库根目录运行 npm install --package-lock-only --ignore-scripts，再运行 npm ci');
  }
  console.log(`已创建并登记 ${target}\n\n在仓库根目录执行：\nnpm ci\nnpm run dev -w ${name}`);
} catch (error) {
  console.error(`创建未完成：${error.message}\n请检查 ${target}，脚本没有删除其中的文件。`);
  process.exit(1);
}
