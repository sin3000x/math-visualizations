import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { installRenderClock } from '../../../packages/video-tools/browser-clock.mjs';

const root = new URL('../', import.meta.url).pathname;
const output = `${root}exports/qa-morph-export`;
await mkdir(output, { recursive: true });
const server = await preview({ root, preview: { host: '127.0.0.1', port: 0 } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(installRenderClock);
  const advance = async time => {
    await page.evaluate(time => window.__videoClock.tick(time), time);
    await page.evaluate(() => window.__videoClock.sync());
  };
  for (const [scene, step, targets] of [
    ['spanning', 3, '.spanning-dual'],
    ['coordinate-reading', 4, '.symbolic-base, .symbolic-number'],
    ['coordinate-reading', 5, '[data-role="symbolic-functional"]'],
    ['independence', 3, '.independence-evaluation [data-from]'],
    ['independence', 6, '.independence-evaluation [data-from]'],
  ]) {
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?export=1&scene=dual-basis-${scene}`);
    await page.evaluate(() => document.fonts.ready);
    let time = 0;
    await advance(time);
    for (let current = 1; current <= step; current++) {
      await page.keyboard.press('ArrowRight');
      await advance(time);
      if (current === step) break;
      time += 5000;
      await advance(time);
      await advance(time + 17);
      time += 34;
    }
    assert(await page.locator('[data-contour-transform]').count() > 0, '必须先出现连续变形轮廓');
    await advance(time + 500);
    assert(await page.locator('[data-contour-transform]').count() > 0, '中途不能提前清除变形');
    await advance(time + 1200);
    await advance(time + 1217);
    await page.screenshot({ path: `${output}/${scene}-${step}-settled.png` });
    assert.equal(await page.locator('[data-contour-transform]').count(), 0, `${scene}/${step}：导出停留帧必须清除临时轮廓`);
    assert(await page.locator(targets).evaluateAll(nodes => nodes.length > 0 && nodes.every(node => getComputedStyle(node).visibility === 'visible')), '停留帧恢复真实 KaTeX 对象');
    assert.equal(await page.locator('.katex-error').count(), 0);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await advance(time + 1300);
    await page.keyboard.press('ArrowLeft');
    await advance(time + 1300);
    await advance(time + 3000);
    await advance(time + 3017);
    assert.equal(await page.locator('[data-contour-transform]').count(), 0, '快速回退不能留下临时轮廓');
  }
  assert.deepEqual(errors, []);
  console.log('导出时钟：张成、坐标读取、线性无关的轮廓交接及回退清理通过');
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
