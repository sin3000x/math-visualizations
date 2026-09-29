import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

// These callbacks stay in each topic: animation continuity before settling,
// mathematical and object-specific assertions after settling.
export async function checkLayout({ root, beforeStep, checkStep }) {
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
    const checkPosition = async expected => {
      await page.waitForFunction(({ scene, step }) => {
        const main = document.querySelector('main');
        return main?.dataset.sceneId === scene && main?.dataset.step === String(step);
      }, expected);
    };
    for (const [name, width, height, recording] of [
      ['desktop', 1440, 1000, false], ['narrow', 390, 844, false], ['recording', 1920, 1080, true],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(url + (recording ? '?export=1' : ''), { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const scenes = JSON.parse(await page.locator('main').getAttribute('data-video-scenes'));
      const states = scenes.flatMap(scene => Array.from({ length: scene.stepCount }, (_, step) => ({ scene: scene.id, step })));
      for (const [index, state] of states.entries()) {
        if (index) await page.keyboard.press('ArrowRight');
        await checkPosition(state);
        const context = { page, state, name, recording, output };
        try {
          await beforeStep?.(context);
          // Infinite decorative motion must not prevent checking settled content.
          await page.waitForFunction(() => document.getAnimations().every(animation =>
            animation.effect?.getComputedTiming().iterations === Infinity ||
            animation.playState === 'finished' || animation.playState === 'idle'));
          await checkStep?.(context);
          await assertLayout(page, `${name}/${state.scene}/${state.step + 1}`, recording);
          assert.deepEqual(errors, [], '页面出现运行时错误');
          await page.screenshot({ path: path.join(output, `${name}-${state.scene}-${state.step}.png`) });
        } catch (error) {
          await page.screenshot({ path: path.join(output, `${name}-${state.scene}-${state.step}-failed.png`) });
          throw error;
        }
      }
      await page.keyboard.press('ArrowRight');
      await checkPosition(states.at(-1));
      for (const state of states.slice(0, -1).reverse()) {
        await page.keyboard.press('ArrowLeft');
        await checkPosition(state);
      }
      await page.keyboard.press('ArrowLeft');
      await checkPosition(states[0]);
      // Check 0 => step 10 and every numeric shortcut, including long scenes.
      for (const scene of scenes) {
        await page.goto(`${url}?scene=${encodeURIComponent(scene.id)}${recording ? '&export=1' : ''}`);
        await checkPosition({ scene: scene.id, step: 0 });
        for (let step = 0; step < Math.min(scene.stepCount, 10); step++) {
          await page.keyboard.press(step === 9 ? '0' : String(step + 1));
          await checkPosition({ scene: scene.id, step });
        }
        assert.equal(await page.locator('.recording-mode').count(), Number(recording));
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.recording-mode').count(), 0);
      await page.locator('.scene-navigation button').first().click();
      await checkPosition(states[0]);
      await page.keyboard.press('PageDown');
      await checkPosition(states[1] ?? states[0]);
      await page.keyboard.press('PageUp');
      await checkPosition(states[0]);
      await page.locator('.scene-navigation button').last().click();
      await checkPosition({ scene: scenes.at(-1).id, step: 0 });
      assert.equal(await page.locator('.scene-navigation button[aria-current]').count(), 1);
      assert.deepEqual(errors, [], '页面出现运行时错误');
      console.log(`${name}: ${states.length} 个步骤、布局、KaTeX、前后导航、数字跳步、场景切换及 Escape 通过`);
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.httpServer.close(resolve));
  }
}

export async function assertLayout(page, label, recording) {
  assert.equal(await page.locator('.katex-error').count(), 0, `${label}: KaTeX 错误`);
  const bounds = await page.evaluate(() => {
    const frame = document.querySelector('.scene-frame').getBoundingClientRect();
    const within = rect => rect.left >= frame.left - 1 && rect.top >= frame.top - 1 && rect.right <= frame.right + 1 && rect.bottom <= frame.bottom + 1;
    const visible = element => {
      for (let node = element; node && node !== document.body; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const identify = element => element.getAttribute('data-role') || element.id || element.getAttribute('class') || element.tagName;
    const content = [...document.querySelectorAll('.scene-content .math-formula, .scene-content .fruit-bag, .scene-content [data-layout-content]')].filter(visible);
    const subtitleContent = [...document.querySelectorAll('.scene-content [data-layout-content]')].filter(visible);
    const navigation = document.querySelector('.scene-navigation');
    const nav = navigation.getBoundingClientRect();
    return {
      noScroll: document.documentElement.scrollHeight === document.documentElement.clientHeight && document.documentElement.scrollWidth === document.documentElement.clientWidth,
      inside: frame.left >= 0 && frame.top >= 0 && frame.right <= innerWidth + 1 && frame.bottom <= innerHeight + 1,
      ratio: frame.width / frame.height,
      clipped: content.filter(element => !within(element.getBoundingClientRect())).map(identify),
      subtitleOverlap: subtitleContent.filter(element => element.getBoundingClientRect().bottom > frame.top + frame.height * .84 + 1).map(identify),
      controls: document.querySelector('.scene-frame').querySelectorAll('nav, button').length,
      navigationOutside: nav.width > 0 && nav.left >= 0 && nav.right <= innerWidth + 1 && nav.bottom <= frame.top + 1 &&
        navigation.scrollWidth <= navigation.clientWidth + 1 && [...navigation.querySelectorAll('button')].every(button => {
          const rect = button.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.bottom <= frame.top + 1;
        }),
    };
  });
  assert(bounds.noScroll && bounds.inside, `${label}: 画布超出视口`);
  assert(Math.abs(bounds.ratio - 16 / 9) < .01, `${label}: 画布不是 16:9`);
  assert.deepEqual(bounds.clipped, [], `${label}: 对象或公式超出画布`);
  assert.deepEqual(bounds.subtitleOverlap, [], `${label}: 教学内容进入底部字幕安全区`);
  assert.equal(bounds.controls, 0, `${label}: 画布内出现导航或按钮`);
  assert.equal(await page.locator('.page-toolbar').isVisible(), !recording);
  if (!recording) assert(bounds.navigationOutside, `${label}: 场景导航必须可访问且位于画布外`);
}
