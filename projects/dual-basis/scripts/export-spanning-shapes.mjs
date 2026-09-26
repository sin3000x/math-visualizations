import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'exports/spanning-morph-source');
await mkdir(output, { recursive: true });
const server = await preview({ root, preview: { host: '127.0.0.1', port: 0 } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?export=1&scene=dual-basis-spanning`);
  await page.evaluate(() => document.fonts.ready);
  const items = [1, 2].map(index => ({ selector: String(index) }));
  for (const side of ['from', 'to']) {
    await page.keyboard.press(side === 'from' ? '2' : '3');
    await page.waitForFunction(() => document.getAnimations().every(a => a.playState === 'finished' || a.playState === 'idle'));
    for (const [i, pair] of items.entries()) {
      const node = page.locator(side === 'from' ? `.number-${i + 1}` : `.dual-${i + 1}`);
      const box = await node.boundingBox();
      const clip = { x: Math.floor(box.x - 2), y: Math.floor(box.y - 2), width: Math.ceil(box.width + 4), height: Math.ceil(box.height + 4) };
      const file = `${i + 1}-${side}.png`;
      await page.screenshot({ path: path.join(output, file), clip });
      pair[side] = { file, width: box.width, height: box.height, offset: [clip.x - box.x, clip.y - box.y] };
    }
  }
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(items));
  execFileSync(process.env.MORPH_PYTHON ?? 'python3', [path.join(root, 'scripts/trace-morph-shapes.py'), output, path.join(root, 'lib/animation/spanning-shapes.json')], {
    stdio: 'inherit', env: { ...process.env, MORPH_EXTRA_COLORS: JSON.stringify(['#eceee8', '#b6b9ad']) },
  });
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
