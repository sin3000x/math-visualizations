import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { checkLayout } from '@math-visualizations/video-tools/layout';
import path from 'node:path';

let notationBeforeMapping;

await checkLayout({
  root: fileURLToPath(new URL('../', import.meta.url)),
  beforeStep: async ({ page, state, name, output }) => {
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
    if (state.scene === 'dual-basis-notation' && state.step === 5) {
      const positions = await page.locator('.notation-scene').evaluate(scene => {
        const animations = scene.getAnimations({ subtree: true }).filter(a => a.playState === 'running');
        const read = () => [...scene.querySelectorAll('.notation-row > :last-child .katex-html')].map(node => {
          const r = node.getBoundingClientRect();
          return { x: r.x, y: r.y };
        });
        const frames = [0, 500, 1000].map(time => {
          animations.forEach(a => { a.pause(); a.currentTime = time; });
          return read();
        });
        animations.forEach(a => a.finish());
        return frames;
      });
      positions[0].forEach((start, i) => {
        assert(Math.abs(start.x - notationBeforeMapping[i].x) < 1 && Math.abs(start.y - notationBeforeMapping[i].y) < 1, '基的移动起点必须与上一步连续');
        const middle = positions[1][i], end = positions[2][i];
        assert(middle.x > Math.min(start.x, end.x) && middle.x < Math.max(start.x, end.x), '基必须经过中间位置，不能闪现');
      });
    }
  },
  checkStep: async ({ page, state }) => {
    if (state.scene === 'dual-basis-notation' && state.step === 4) {
      notationBeforeMapping = await page.locator('.notation-row > :last-child .katex-html').evaluateAll(nodes => nodes.map(node => {
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y };
      }));
    }
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
      assert.equal(await page.locator('.spanning-content').isVisible(), state.step > 0);
      assert.equal(await page.locator('.evaluation-0 [data-role=internal-prices]').count(), 0, '任意 f 的屏幕留空');
      assert.equal(await page.locator('.spanning-scene [data-role=internal-prices]').count(), state.step >= 3 ? 2 : 0);
      const contact = await page.locator('.spanning-scene [data-checkout-placement]').evaluateAll(bags => bags.map(bag => Math.abs(bag.getBoundingClientRect().bottom - bag.parentElement.querySelector('.checkout-tray').getBoundingClientRect().top) < 1));
      assert(contact.every(Boolean), '袋底接触托盘');
      if (state.step === 6) assert.equal(await page.locator('.spanning-scene').getAttribute('data-sample'), '8');
      if (state.step >= 7) {
        assert.equal(await page.locator('.spanning-evaluation:not(.evaluation-0) [data-checkout-placement]').count(), 2, '最终保留两个基袋结算图标');
        assert(!(await page.locator('.evaluation-0 > [data-checkout-placement]').isVisible()));
        assert(!(await page.locator('.spanning-argument').isVisible()));
        assert.equal(await page.locator('.spanning-formula, .spanning-values').count(), 0);
      }
    }
    if (state.scene === 'dual-basis-notation') {
      for (const [role, firstStep] of [['notation-basis-map', 5], ['notation-isomorphism', 6], ['notation-vector-map', 7], ['notation-new-basis-map', 8]]) {
        assert.equal(await page.locator(`[data-role=${role}]`).count(), state.step >= firstStep ? 1 : 0);
      }
      assert.equal(await page.locator('[data-role=notation-functionals]').count(), state.step >= 1 ? 1 : 0);
      assert.equal(await page.locator('[data-role=notation-condition]').count(), state.step === 2 ? 1 : 0);
      assert.equal(await page.locator('[data-role=notation-alternative]').count(), state.step === 4 ? 1 : 0);
      assert.equal(await page.locator('.notation-map-label').count(), 0);
      if (state.step === 8) {
        const equals = await page.locator('.notation-expansion > :first-child').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().right));
        assert(Math.abs(equals[0] - equals[1]) < 1, '两行展开式的等号必须对齐');
      }
      if (state.step >= 1) {
        const symbols = await page.locator('.notation-symbols annotation').textContent();
        assert.equal(symbols, state.step >= 3 ? '(v_1^*,\\ldots,v_n^*)' : '(f_1,\\ldots,f_n)');
      }
    }
  },
});
