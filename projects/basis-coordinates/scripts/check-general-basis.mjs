import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

// 独立核对不同基、不同线性报价以及负坐标；不是仅验证上一幕的特殊数值。
for (const [v1, v2] of [[[1, 0], [0, 1]], [[1, 1], [0, 1]], [[2, -1], [1, 3]]]) {
  assert.notEqual(v1[0] * v2[1] - v1[1] * v2[0], 0);
  for (const [a, b] of [[2, 3], [-2, .5], [0, 0]]) {
    for (const [p, q] of [[5, 3], [2, -4]]) {
      const f = ([x, y]) => p * x + q * y;
      const v = [a * v1[0] + b * v2[0], a * v1[1] + b * v2[1]];
      assert(Math.abs(f(v) - a * f(v1) - b * f(v2)) < 1e-10);
    }
  }
}
const server = await preview({ preview: { host: '127.0.0.1', port: 0 } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  await mkdir('exports/qa-general-basis', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.getByRole('button', { name: '行向量来自基袋结账', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  for (let step = 0; step < 6; step++) {
    if (step) await page.keyboard.press('ArrowRight');
    if (step >= 3) {
      const flights = await page.evaluate(step => {
        const targets = [...document.querySelectorAll(step === 5 ? '[data-role="general-column-entry"]' : '[data-role="general-row-entry"]')];
        return targets.filter(target => target.getAnimations().length).map((target, i) => {
          const source = document.querySelector(step === 5 ? `[data-coordinate="${i}"]` : '[data-role="symbolic-quote"]');
          const animation = target.getAnimations()[0];
          animation.pause(); animation.currentTime = step === 5 ? 0 : 1900;
          const from = source.getBoundingClientRect(), to = target.getBoundingClientRect();
          const error = Math.hypot(from.x + from.width / 2 - to.x - to.width / 2, from.y + from.height / 2 - to.y - to.height / 2);
          animation.currentTime += 550;
          const mid = target.getBoundingClientRect();
          const distance = Math.hypot(mid.x + mid.width / 2 - from.x - from.width / 2, mid.y + mid.height / 2 - from.y - from.height / 2);
          animation.finish(); return { error, distance };
        });
      }, step);
      assert.equal(flights.length, step === 5 ? 2 : 1);
      assert(flights.every(flight => flight.error < 1 && flight.distance > 30), JSON.stringify({ step, flights }));
    }
    await page.waitForFunction(() => document.getAnimations().every(a => ['finished', 'idle'].includes(a.playState)));
    assert.equal(await page.locator('.general-basis-result-bag').isVisible(), step >= 1);
    assert.equal(await page.locator('[data-role="general-basis-linearity"]').count(), step >= 2 ? 1 : 0);
    assert.equal(await page.locator('[data-role="general-row-entry"]:visible').count(), Math.min(2, Math.max(0, step - 2)));
    if (step >= 3) {
      const gap = await page.evaluate(() => document.querySelector('.general-basis-probe .fruit-bag').getBoundingClientRect().bottom - document.querySelector('.general-basis-machine .probe-tray').getBoundingClientRect().top);
      assert(Math.abs(gap) < 1);
      assert(await page.locator('.general-basis-quote').evaluateAll(nodes => nodes.every(node => Number(getComputedStyle(node).opacity) === 0)));
    }
    assert.equal(await page.locator('.katex-error').count(), 0);
    await page.screenshot({ path: `exports/qa-general-basis/step-${step}.png` });
  }
  assert.deepEqual(errors, []);
  console.log('一般基 6 步通过：任意基数值验证、先基后坐标、逐项结账入行、坐标入列、动画来源与袋底接触。');
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
