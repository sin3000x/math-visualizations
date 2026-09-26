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
      if (state.scene === 'dual-basis-coordinate-reading' && state.step === 3) {
        const transfers = await page.locator('[data-role=reading]').evaluateAll(nodes => nodes.map(node => ({
          retained: node.dataset.continuity === 'checkout-result',
          transitions: node.getAnimations().filter(animation => animation instanceof CSSTransition).map(animation => ({
            property: animation.transitionProperty,
            values: animation.effect.getKeyframes().map(frame => frame[animation.transitionProperty]),
          })),
        })));
        transfers.forEach((transfer, index) => {
          assert(transfer.retained, '展开系数必须复用上一步的读数元素');
          assert.deepEqual(transfer.transitions.find(item => item.property === 'left')?.values, ['1200px', index === 0 ? '470px' : '960px']);
          assert.deepEqual(transfer.transitions.find(item => item.property === 'top')?.values, [index === 0 ? '123px' : '443px', '290px']);
        });
      }
      if (state.scene === 'dual-basis-coordinate-reading' && state.step >= 4) {
        const morph = await page.evaluate(() => {
          const layer = document.querySelector('.symbolic-expansion');
          const animations = layer.getAnimations({ subtree: true });
          animations.forEach(animation => { animation.pause(); animation.currentTime = 0; });
          const paths = [...layer.querySelectorAll('[data-contour-transform] path')];
          const start = paths.map(path => getComputedStyle(path).d);
          animations.forEach(animation => { animation.currentTime = 500; });
          const middle = paths.map(path => getComputedStyle(path).d);
          animations.forEach(animation => { animation.currentTime = 999; });
          const end = paths.map(path => getComputedStyle(path).d);
          animations.forEach(animation => { animation.currentTime = 250; });
          return {
            groups: layer.querySelectorAll('[data-contour-transform]').length,
            moving: paths.every((_, i) => start[i] !== middle[i] && middle[i] !== end[i]),
            noOpacitySwitch: animations.every(animation => animation.effect.getKeyframes().every(frame => !('opacity' in frame) && !('visibility' in frame))),
          };
        });
        assert.equal(morph.groups, state.step === 4 ? 7 : 2, '第二步只能变换两个系数');
        assert(morph.moving, '中间帧必须是变化中的轮廓，不能替换起止图形');
        assert(morph.noOpacitySwitch, '轮廓补间不应以淡入淡出或可见性切换替代');
        for (const [namePart, time] of [['quarter', 250], ['midpoint', 500], ['three-quarter', 750], ['near-end', 999]]) {
          await page.evaluate(time => document.querySelector('.symbolic-expansion').getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = time; }), time);
          await page.screenshot({ path: path.join(output, `${name}-symbol-transform-${state.step}-${namePart}.png`) });
        }
        await page.evaluate(() => document.querySelector('.symbolic-expansion').getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = 500; animation.play(); }));
      }
      if (state.scene === 'dual-basis-independence' && [3, 6].includes(state.step)) {
        const morph = await page.locator('.independence-evaluation').evaluate(layer => {
          const animations = layer.getAnimations({ subtree: true });
          animations.forEach(a => { a.pause(); a.currentTime = 0; });
          const paths = [...layer.querySelectorAll('[data-contour-transform] path')];
          const start = paths.map(p => getComputedStyle(p).d);
          animations.forEach(a => { a.currentTime = 550; });
          const middle = paths.map(p => getComputedStyle(p).d);
          animations.forEach(a => { a.currentTime = 1099; });
          const end = paths.map(p => getComputedStyle(p).d);
          animations.forEach(a => { a.currentTime = 550; });
          return {
            groups: layer.querySelectorAll('[data-contour-transform]').length,
            moving: paths.every((_, i) => start[i] !== middle[i] && middle[i] !== end[i]),
            sources: [...layer.querySelectorAll('.independence-number')].map(e => e.dataset.from),
          };
        });
        assert.equal(morph.groups, 5);
        assert(morph.moving, '三个整项及运算符必须连续变形');
        assert(morph.sources.every(s => s.endsWith('.independence-machine-expression')), '源必须是完整结算项');
        await page.screenshot({ path: path.join(output, `${name}-independence-morph-${state.step}-midpoint.png`) });
        await page.locator('.independence-evaluation').evaluate(layer => layer.getAnimations({ subtree: true }).forEach(a => a.play()));
      }
      await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState === 'finished' || animation.playState === 'idle'));
      assert.equal(await page.locator('.katex-error').count(), 0);
      if (state.scene === 'dual-basis-coordinate-reading' && state.step >= 4) {
        assert.equal(await page.locator('[data-role=symbolic-functional]').count(), state.step === 5 ? 2 : 0);
        for (const number of await page.locator('[data-role=symbolic-number]').all()) assert.equal(await number.isVisible(), state.step === 4);
      }
      if (state.scene === 'dual-basis-coordinate-reading' && state.step === 2) {
        await page.locator('[data-role=reading]').evaluateAll(nodes => nodes.forEach(node => { node.dataset.continuity = 'checkout-result'; }));
      }
      if (['dual-basis-pairing', 'dual-basis-coordinate-reading'].includes(state.scene) && state.step >= 1 && !(state.scene === 'dual-basis-coordinate-reading' && state.step >= 3)) {
        const screens = await page.evaluate(() => [...document.querySelectorAll('.priced-machine')].map(machine => {
          const screen = machine.querySelector('.checkout-screen').getBoundingClientRect();
          const prices = machine.querySelector('[data-role=internal-prices]').getBoundingClientRect();
          return prices.left >= screen.left && prices.right <= screen.right && prices.top >= screen.top && prices.bottom <= screen.bottom;
        }));
        const probeCount = 2;
        assert.deepEqual(screens, Array(probeCount).fill(true), '单价必须完整位于收银台屏幕内');
        assert.equal(await page.locator('[data-role=unit-price-apple]').count(), probeCount);
        assert.equal(await page.locator('[data-role=unit-price-banana]').count(), probeCount);
      }
      if (state.scene === 'dual-basis-coordinate-reading') {
        assert.deepEqual(await page.locator('[data-role=reading]').evaluateAll(nodes => nodes.map(node => node.dataset.value)), ['3', '2'].slice(0, state.step));
        assert.equal(await page.locator('[data-role=basis-expansion]').count(), state.step >= 3 ? 1 : 0);
        const contact = await page.locator('[data-role=tray-bag]').evaluateAll(bags => bags.map(bag => {
          const tray = bag.parentElement.querySelector('[data-role=checkout-tray]').getBoundingClientRect();
          return Math.abs(bag.getBoundingClientRect().bottom - tray.top) < 1;
        }));
        assert(contact.every(Boolean), '水果袋底部必须落在托盘上');
      } else if (state.scene === 'dual-basis-pairing') {
        assert.equal(await page.locator('[data-role=pairing]').count(), Math.max(0, state.step - 1));
      }
      if (state.scene === 'dual-basis-pairing' && state.step >= 2) {
        assert.equal(await page.locator('.probe.active').getAttribute('data-probe'), state.step < 4 ? '1' : '2');
        assert.equal(await page.locator('[data-role=reading]').getAttribute('data-value'), ['1', '0', '0', '1'][state.step - 2]);
      }
      if (state.scene === 'dual-basis-independence') {
        const expected = state.step === 3 || state.step === 4 ? ['x', '0', '0'] : state.step >= 6 ? ['0', 'y', '0'] : [];
        assert.deepEqual(await page.locator('.independence-number annotation').allTextContents(), expected);
        assert.equal(await page.locator('.independence-tray-bag').count(), state.step >= 2 ? 3 : 0);
        assert.equal(await page.locator('.independence-source').count(), 0);
        const alignment = await page.locator('.independence-counter').evaluateAll(counters => counters.map(counter => {
          const body = counter.querySelector('.checkout-body').getBoundingClientRect();
          const label = counter.querySelector('.independence-counter-label').getBoundingClientRect();
          return Math.abs((body.left + body.right - label.left - label.right) / 2) < 1 && label.top >= body.bottom;
        }));
        assert(alignment.every(Boolean), '标签必须位于收银台底边下方并居中');
        const contact = await page.locator('.independence-tray-bag').evaluateAll(bags => bags.map(bag => {
          const tray = bag.parentElement.querySelector('.checkout-tray').getBoundingClientRect();
          return Math.abs(bag.getBoundingClientRect().bottom - tray.top) < 1;
        }));
        assert(contact.every(Boolean), '基袋必须落在三个托盘上');
      }
      if (state.scene === 'dual-basis-spanning') {
        assert.equal(await page.locator('.evaluation-0 [data-role=internal-prices]').count(), 0, '任意 f 的屏幕留空');
        assert.equal(await page.locator('.spanning-scene [data-role=internal-prices]').count(), state.step >= 2 ? 2 : 0);
        const contact = await page.locator('.spanning-scene [data-checkout-placement]').evaluateAll(bags => bags.map(bag => Math.abs(bag.getBoundingClientRect().bottom - bag.parentElement.querySelector('.checkout-tray').getBoundingClientRect().top) < 1));
        assert(contact.every(Boolean), '袋底接触托盘');
        if (state.step === 5) assert.equal(await page.locator('.spanning-scene').getAttribute('data-sample'), '8');
        if (state.step === 6) {
          assert.equal(await page.locator('.spanning-evaluation:not(.evaluation-0) [data-checkout-placement]').count(), 2, '最终保留两个基袋结算图标');
          assert(!(await page.locator('.evaluation-0 > [data-checkout-placement]').isVisible()));
          assert(!(await page.locator('.spanning-argument').isVisible()));
          assert.equal(await page.locator('.spanning-formula, .spanning-values').count(), 0);
        }
      }
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
          subtitleSafe: [...document.querySelectorAll('.space-outline, .basis-bag, .probe, .checkout-reading, [data-role=pairing], .independence-evaluation, .independence-conclusions, .independence-term, .spanning-evaluation, .spanning-dual, .spanning-argument, .spanning-extracted-bag, .spanning-decomposition > span, .spanning-scene h1')].filter(visible).every(element => element.getBoundingClientRect().bottom <= frame.top + frame.height * .84),
          controls: document.querySelector('.scene-frame').querySelectorAll('nav, button').length,
        };
      });
      assert(bounds.noScroll && bounds.inside, `${name}: 画布超出视口`);
      assert(Math.abs(bounds.ratio - 16 / 9) < .01);
      assert.equal(bounds.clipped, 0, `${name}: 对象或公式超出画布`);
      assert.equal(bounds.controls, 0);
      assert(bounds.subtitleSafe, `${name}: 教学内容进入底部字幕安全区`);
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
