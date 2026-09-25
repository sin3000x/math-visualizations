import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'exports/morph-source');
await mkdir(output, { recursive: true });
const server = await preview({ root, preview: { host: '127.0.0.1', port: 0 } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?export=1`);
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('6');
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState === 'finished' || a.playState === 'idle'));
  const targets = await page.locator('[data-symbol-source]').all();
  const items = [];
  for (let i = 0; i < targets.length; i++) {
    const selector = await targets[i].getAttribute('data-symbol-source');
    const pair = { selector };
    for (const side of ['from', 'to']) {
      const node = side === 'from' ? page.locator(selector) : targets[i];
      const box = await node.boundingBox();
      const handle = node.locator('.bag-handle');
      const top = await handle.count() ? Math.min(box.y, (await handle.boundingBox()).y) : box.y;
      const clip = { x: Math.floor(box.x - 3), y: Math.floor(top - 3), width: Math.ceil(box.width + 6), height: Math.ceil(box.y + box.height - top + 6) };
      const file = `${i}-${side}.png`;
      await page.screenshot({ path: path.join(output, file), clip });
      pair[side] = { file, width: box.width, height: box.height, offset: [clip.x - box.x, clip.y - box.y] };
    }
    items.push(pair);
  }
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(items));
  execFileSync(process.env.MORPH_PYTHON ?? 'python3', [path.join(root, 'scripts/trace-morph-shapes.py'), output, path.join(root, 'lib/animation/coordinate-shapes.json')], { stdio: 'inherit' });
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
