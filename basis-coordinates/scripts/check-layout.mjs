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
