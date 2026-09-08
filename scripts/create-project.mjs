#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const name = process.argv[2];
if (process.argv.length !== 3 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name ?? '')) {
  console.error('用法：node scripts/create-project.mjs <小写英文项目名，例如 linear-map>');
  process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, name);
try {
  // 不覆盖已有目录，包括已有子项目。
  await mkdir(target);
} catch (error) {
  console.error(error.code === 'EEXIST' ? `目录已存在，未覆盖：${target}` : error.message);
  process.exit(1);
}
try {
  await cp(path.join(root, 'templates/scene-project'), target, {
    recursive: true,
    filter: source => !['node_modules', 'dist', '.DS_Store'].includes(path.basename(source)) && !source.endsWith('.tsbuildinfo'),
  });
  for (const file of ['package.json', 'package-lock.json']) {
    const filename = path.join(target, file);
    const data = JSON.parse(await readFile(filename, 'utf8'));
    data.name = name;
    if (data.packages) data.packages[''].name = name;
    await writeFile(filename, `${JSON.stringify(data, null, 2)}\n`);
  }
  console.log(`已创建 ${target}\n\ncd ${name}\nnpm ci\nnpm run dev`);
} catch (error) {
  console.error(`创建未完成：${error.message}\n请检查 ${target}，脚本没有删除其中的文件。`);
  process.exit(1);
}
