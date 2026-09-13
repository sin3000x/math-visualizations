import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'exports/qa-layout');
await mkdir(output, { recursive: true });
const server = await preview({ root, preview: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  const url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  assert((await fetch(url)).ok, '预览服务不可访问');
  browser = await chromium.launch({ channel: process.env.VIDEO_BROWSER ?? 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  for (const [name, width, height, recording] of [
    ['desktop', 1440, 1000, false], ['narrow', 390, 844, false], ['recording', 1920, 1080, true],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(url + (recording ? '?export=1' : ''));
    await page.evaluate(() => document.fonts.ready);
    const scenes = JSON.parse(await page.locator('main').getAttribute('data-video-scenes'));
    const states = scenes.flatMap(scene => Array.from({ length: scene.stepCount }, (_, step) => ({ scene: scene.id, step })));
    const checkPosition = async expected => {
      assert.equal(await page.locator('main').getAttribute('data-scene-id'), expected.scene);
      assert.equal(await page.locator('main').getAttribute('data-step'), String(expected.step));
    };
    for (let index = 0; index < states.length; index++) {
      if (index) await page.keyboard.press('ArrowRight');
      const state = states[index];
      await checkPosition(state);
      await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState === 'finished' || animation.playState === 'idle'));
      assert.equal(await page.locator('.katex-error').count(), 0);
      const bounds = await page.evaluate(() => {
        const frame = document.querySelector('.scene-frame').getBoundingClientRect();
        const within = rect => rect.left >= frame.left - 1 && rect.top >= frame.top - 1 && rect.right <= frame.right + 1 && rect.bottom <= frame.bottom + 1;
        const visible = element => {
          for (let node = element; node && node !== document.body; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
          }
          return true;
        };
        return {
          noScroll: document.documentElement.scrollHeight === document.documentElement.clientHeight,
          inside: frame.left >= 0 && frame.top >= 0 && frame.right <= innerWidth + 1 && frame.bottom <= innerHeight + 1,
          ratio: frame.width / frame.height,
          clipped: [...document.querySelectorAll('.scene-content .math-formula, .scene-content .fruit-bag')].filter(visible).filter(element => !within(element.getBoundingClientRect())).length,
          controls: document.querySelector('.scene-frame').querySelectorAll('nav, button').length,
        };
      });
      assert(bounds.noScroll && bounds.inside, `${name}: 画布超出视口`);
      assert(Math.abs(bounds.ratio - 16 / 9) < .01);
      assert.equal(bounds.clipped, 0, `${name}: 对象或公式超出画布`);
      assert.equal(bounds.controls, 0);
      assert.equal(await page.locator('.page-toolbar').isVisible(), !recording);
      if (state.scene === 'fruit-bag-basis' && state.step === 3) {
        const centers = await page.locator('[data-motion]').evaluateAll(elements => Object.fromEntries(elements.map(element => {
          const rect = element.getBoundingClientRect();
          return [element.dataset.motion, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }];
        })));
        assert(Math.abs(centers['basis-1'].y - centers['basis-2'].y) < 1, '两个基袋应处于同一行');
        assert(Math.abs(centers.a.x - centers.b.x) < 1, '两个系数应处于同一列');
        assert(centers['basis-1'].x < centers['basis-2'].x && centers.a.y < centers.b.y, '行列顺序必须对应');
      }
      if (state.scene === 'checkout-basis-prices') {
        assert.equal(await page.locator('.checkout-receipt').count(), 0, '所有步骤均不显示小票');
        if (state.step === 1 || state.step >= 3) {
          const contacts = await page.locator('.probe-mini-assembly, .probe-machine').evaluateAll(machines => machines.flatMap(machine => {
            const tray = machine.querySelector('.probe-tray')?.getBoundingClientRect();
            const bag = machine.querySelector('.probe-tray-bag .fruit-bag')?.getBoundingClientRect();
            return tray && bag ? [{ gap: Math.abs(bag.bottom - tray.top), supported: bag.left >= tray.left - 1 && bag.right <= tray.right + 1 }] : [];
          }));
          assert.equal(contacts.length, state.step === 1 ? 5 : 1);
          assert(contacts.every(contact => contact.gap < 1 && contact.supported), '袋底必须落在托盘上');
        }
        if (state.step >= 2) {
          const apple = await page.locator('[data-role="unit-price-apple"] annotation').textContent();
          const banana = await page.locator('[data-role="unit-price-banana"] annotation').textContent();
          assert(apple.startsWith(state.step >= 5 ? '5' : '?'));
          assert(banana.startsWith(state.step >= 8 ? '3' : '?'));
          const insideScreen = await page.locator('.probe-machine').evaluate(machine => {
            const screen = machine.querySelector('.checkout-screen').getBoundingClientRect();
            const prices = machine.querySelector('.probe-prices').getBoundingClientRect();
            return prices.left >= screen.left && prices.right <= screen.right && prices.top >= screen.top && prices.bottom <= screen.bottom;
          });
          assert(insideScreen, '单价必须完整显示在屏幕内');
        }
        assert.equal(await page.locator('[data-role="price-result"]').count(), [4, 7].includes(state.step) ? 1 : 0, '填入单价后移除结果标签');
      }
      if (state.scene === 'checkout-general-bag') {
        assert.equal(await page.locator('[data-role="general-price"]').count(), state.step >= 1 ? 1 : 0);
        assert.equal(await page.locator('[data-role="general-bag"] .fruit-bag').getAttribute('aria-label'), '水果袋：a 斤苹果，b 斤香蕉');
        const contact = await page.locator('.probe-machine').evaluate(machine => {
          const tray = machine.querySelector('.probe-tray').getBoundingClientRect();
          const bag = machine.querySelector('.fruit-bag').getBoundingClientRect();
          return Math.abs(bag.bottom - tray.top) < 1 && bag.left >= tray.left && bag.right <= tray.right;
        });
        assert(contact, '任意袋的袋底必须落在同一托盘上');
        assert.equal(await page.locator('[data-role="coordinate-copy"]').count(), state.step >= 3 ? 1 : 0);
        assert.equal(await page.locator('[data-role="result-copy"]').count(), state.step >= 4 ? 1 : 0);
        assert.equal(await page.locator('[data-role="checkout-copy"]').count(), state.step >= 5 ? 1 : 0);

        if (state.step >= 1) assert.equal(await page.locator('[data-role="general-price"] annotation').textContent(), '5a+3b\\,\\text{元}');
      }
      await page.screenshot({ path: path.join(output, `${name}-${state.scene}-${state.step}.png`) });
    }
    await page.keyboard.press('ArrowRight');
    await checkPosition(states.at(-1));
    for (const state of states.slice(0, -1).reverse()) {
      await page.keyboard.press('ArrowLeft');
      await checkPosition(state);
    }
    await page.keyboard.press('ArrowLeft');
    await checkPosition(states[0]);
    await page.keyboard.press(String(scenes[0].stepCount));
    await checkPosition({ scene: scenes[0].id, step: scenes[0].stepCount - 1 });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.recording-mode').count(), 0);
    await page.locator('.scene-navigation button').last().click();
    await checkPosition({ scene: scenes.at(-1).id, step: 0 });
    assert.equal(await page.locator('.scene-navigation button[aria-current]').count(), 1);
    console.log(`${name}: ${states.length} 个步骤、前后导航、数字跳步、场景切换及 Escape 通过`);
  }
  assert.deepEqual(errors, []);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
