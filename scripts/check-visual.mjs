// 并行运行各 workspace 的视觉检查（check:layout，再 video:check），最后汇总结果。
// 每个项目内部仍按顺序执行；日志写入 <项目>/exports/check-visual.log。
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const VISUAL_SCRIPTS = ['check:layout', 'video:check'];
const repository = fileURLToPath(new URL('../', import.meta.url));

/** 登记了视觉检查脚本的 workspace，按根 package.json 中的顺序。 */
export async function visualWorkspaces(root = repository) {
  const { workspaces } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const found = [];
  for (const folder of workspaces) {
    const manifest = JSON.parse(await readFile(path.join(root, folder, 'package.json'), 'utf8'));
    const scripts = VISUAL_SCRIPTS.filter(name => manifest.scripts?.[name]);
    if (scripts.length) found.push({ name: manifest.name, folder, scripts });
  }
  return found;
}

function run(workspace, log) {
  return new Promise(resolve => {
    const command = workspace.scripts.map(script => `npm run ${script}`).join(' && ');
    const child = spawn(command, { cwd: path.join(repository, workspace.folder), shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.on('close', code => resolve(code ?? 1));
  });
}

async function main() {
  const { values } = parseArgs({ options: {
    jobs: { type: 'string', default: String(Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2)))) },
    only: { type: 'string' },
    list: { type: 'boolean', default: false },
  } });
  let targets = await visualWorkspaces();
  if (values.only) {
    const wanted = new Set(values.only.split(','));
    const unknown = [...wanted].filter(name => !targets.some(target => target.name === name));
    if (unknown.length) throw new Error(`没有视觉检查的 workspace：${unknown.join('、')}`);
    targets = targets.filter(target => wanted.has(target.name));
  }
  if (values.list) {
    for (const target of targets) console.log(`${target.name}\t${target.scripts.join(' → ')}`);
    return;
  }
  const jobs = Number(values.jobs);
  if (!Number.isSafeInteger(jobs) || jobs < 1) throw new Error('--jobs 必须为正整数');

  console.log(`视觉检查：${targets.length} 个项目，并行 ${jobs} 个`);
  const results = [];
  const queue = [...targets];
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    for (let target = queue.shift(); target; target = queue.shift()) {
      const directory = path.join(repository, target.folder, 'exports');
      await mkdir(directory, { recursive: true });
      const logFile = path.join(directory, 'check-visual.log');
      const log = createWriteStream(logFile);
      const start = Date.now();
      const code = await run(target, log);
      await new Promise(resolve => log.end(resolve));
      const seconds = Math.round((Date.now() - start) / 1000);
      results.push({ ...target, code, seconds, logFile });
      console.log(`${code === 0 ? '✔' : '✖'} ${target.name}（${seconds}s）`);
    }
  }));

  const failed = results.filter(result => result.code !== 0);
  for (const result of failed) {
    const tail = (await readFile(result.logFile, 'utf8')).trimEnd().split('\n').slice(-20).join('\n');
    console.error(`\n✖ ${result.name} 失败，完整日志：${path.relative(repository, result.logFile)}\n${tail}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} 个项目通过`);
  process.exitCode = failed.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
