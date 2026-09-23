import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch({ channel: process.env.VIDEO_BROWSER ?? 'chrome', headless: true });
const errors = [];
try {
  for (const [project, cases] of Object.entries({
    'dual-space': [['CheckoutLinearityScene', 1], ['CheckoutLinearityScene', 2]],
    'dual-basis': [['dual-basis-pairing', 2], ['dual-basis-pairing', 3], ['dual-basis-pairing', 4], ['dual-basis-pairing', 5]],
    'basis-coordinates': [['checkout-basis-prices', 3], ['checkout-basis-prices', 6], ['checkout-general-bag', 0], ['change-basis-same-price', 5], ['change-basis-same-price', 6]],
    'double-dual': [['measuring-a-measurement', 1], ['supermarket-price-survey', 2], ['supermarket-price-survey', 5]],
  })) {
    const server = await createServer({ root: `${root}/projects/${project}`, server: { host: '127.0.0.1', port: 0 } });
    await server.listen();
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
    const output = `${root}/projects/${project}/exports/qa-placement`;
    await mkdir(output, { recursive: true });
    try {
      for (const [scene, step] of cases) {
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?export=1&scene=${scene}`);
        await page.evaluate(() => document.fonts.ready);
        await page.keyboard.press(String(step + 1));
        if (project === 'dual-space') for (let phase = 0; phase < 4; phase++) await page.keyboard.press('ArrowRight');
        const origins = await page.evaluate(() => {
          const nodes = [...document.querySelectorAll('[data-placement-source]')];
          return nodes.map(node => {
            for (const animation of node.getAnimations()) { animation.pause(); animation.currentTime = 0; }
            const source = node.closest('section').querySelector(node.dataset.placementSource).getBoundingClientRect();
            const moving = node.querySelector('.fruit-bag').getBoundingClientRect();
            return Math.max(Math.abs(source.x - moving.x), Math.abs(source.y - moving.y), Math.abs(source.width - moving.width));
          });
        });
        origins.forEach(error => assert(error < 2, `动画起点与源袋不重合: ${error}`));
        await page.evaluate(() => document.getAnimations().forEach(animation => animation.finish()));
        assert.equal(await page.locator('.katex-error').count(), 0);
        const contact = await page.evaluate(() => {
          const bags = [...document.querySelectorAll('[data-checkout-placement]')];
          return bags.map(node => {
            const scope = node.closest('.probe, .probe-machine, .definition-loaded-checkout');
            if (!scope) return null; // 超市队列的袋子与托盘在不同 DOM 分支。
            const tray = scope.querySelector('.checkout-tray, .probe-tray, .definition-tray').getBoundingClientRect();
            const bag = node.querySelector('.fruit-bag').getBoundingClientRect();
            return { gap: tray.top - bag.bottom, inside: bag.left >= tray.left - 2 && bag.right <= tray.right + 2 };
          }).filter(Boolean);
        });
        assert(await page.locator('[data-checkout-placement]').count() > 0);
        for (const result of contact) {
          assert(Math.abs(result.gap) < 11, `${project}/${scene}: 袋底未落在托盘上 ${JSON.stringify(result)}`);
          assert(result.inside, `${project}/${scene}: 袋子超出托盘`);
        }
        await page.screenshot({ path: `${output}/${scene}-${step}.png` });
        // 快速前后跳转必须取消旧动画，无残留、无无限动画。
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowRight');
        await page.evaluate(() => document.getAnimations().forEach(animation => animation.finish()));
        console.log(`${project}/${scene}/${step}: 公共放袋动画、托盘接触与快速回退通过`);
      }
    } finally { await page.close(); await server.close(); }
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
