import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { lagrangeNodes, lagrangeValue, examplePolynomial } from '../lib/math/lagrange.ts';
const root = new URL('../', import.meta.url).pathname;
for (const [i] of lagrangeNodes.entries()) for (const [j, x] of lagrangeNodes.entries()) assert(Math.abs(lagrangeValue(i, x) - (i === j ? 1 : 0)) < 1e-12);
for (const coefficients of [[0, 0, 0], [1, 2, -1], [-2, .5, 3]]) {
  const p = x => coefficients[0] + coefficients[1] * x + coefficients[2] * x * x;
  for (const x of [-2, -.5, 0, .3, 1, 2]) assert(Math.abs(p(x) - lagrangeNodes.reduce((sum, node, i) => sum + p(node) * lagrangeValue(i, x), 0)) < 1e-12);
}
await mkdir(`${root}exports/qa-lagrange`, { recursive: true });
const server = await preview({ root, preview: { host: '127.0.0.1', port: 0 } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  assert((await fetch(url)).ok);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  for (const [name, width, height, recording] of [['desktop', 1440, 1000, false], ['narrow', 390, 844, false], ['recording', 1920, 1080, true]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${url}?scene=dual-basis-lagrange${recording ? '&export=1' : ''}`);
    await page.evaluate(() => document.fonts.ready);
    for (let step = 0; step < 11; step++) {
      if (step) await page.keyboard.press('ArrowRight');
      await page.waitForFunction(step => document.querySelector('main').dataset.step === String(step), step);
      if (step === 5) {
        const motions = await page.locator('.lagrange-functionals > div').evaluateAll(nodes => nodes.map(node => ({
          identity: node.dataset.qaIdentity,
          top: node.getAnimations().find(a => a.transitionProperty === 'top')?.effect.getKeyframes().map(frame => frame.top),
        })));
        assert.deepEqual(motions.map(n => n.identity), ['0', '1', '2']);
        assert.deepEqual(motions.map(n => n.top), [['220px', '90px'], ['355px', '90px'], ['490px', '90px']]);
      }
      if (step === 10) {
        const motion = await page.locator('.lagrange-reading').evaluateAll(nodes => nodes.map(node => {
          const animation = node.getAnimations().find(a => a.transitionProperty === 'left');
          return animation?.effect.getKeyframes().map(frame => frame.left);
        }));
        assert.deepEqual(motion, [['480px', '225px'], ['635px', '585px'], ['815px', '945px']]);
      }
      if (step === 10) {
        for (const time of [0, 1500, 2000]) {
          await page.evaluate(time => document.getAnimations().forEach(a => { a.pause(); a.currentTime = time; }), time);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          if (time === 2000) {
            const factors = await page.locator('.lagrange-basis-graph svg').evaluateAll(nodes => nodes.map(n => Number(n.dataset.scaleFactor)));
            factors.forEach((factor, i) => assert(Math.abs(factor - examplePolynomial(lagrangeNodes[i])) < 1e-12));
          }
          if (time === 2000) {
            const paths = await page.locator('.lagrange-basis-graph .lagrange-curve').evaluateAll(nodes => nodes.map(n => n.getAttribute('d')));
            paths.forEach((path, i) => {
              const points = [...path.matchAll(/[ML]([^,]+),([^ML]+)/g)].map(match => [Number(match[1]), Number(match[2])]);
              assert.equal(points.length, 121);
              points.forEach(([px, py]) => assert(Math.abs(py - (112 - 48 * examplePolynomial(lagrangeNodes[i]) * lagrangeValue(i, (px - 72) / 48))) < 1e-9));
            });
            assert.equal(await page.locator('[data-role=reconstruction-term]').count(), 0);
            assert(await page.locator('.lagrange-basis-graph svg').evaluateAll(nodes => nodes.every(n => getComputedStyle(n).opacity === '1')));
          }
          if (recording) await page.screenshot({ path: `${root}exports/qa-lagrange/scaling-${time}.png` });
        }
        await page.evaluate(() => document.getAnimations().forEach(a => a.finish()));
      }
      await page.waitForFunction(() => document.getAnimations().every(a => a.playState === 'finished' || a.playState === 'idle'));
      assert.equal(await page.locator('.katex-error').count(), 0);
      if (step === 1) await page.locator('.lagrange-functionals > div').evaluateAll(nodes => nodes.forEach((node, i) => { node.dataset.qaIdentity = String(i); }));

      assert.equal(await page.locator('[data-role=polynomial-dual-space]').count(), 1);
      if (step === 0) assert.equal(await page.locator('.lagrange-scene').getAttribute('data-basis-focused'), 'false');
      assert.equal(await page.locator('.lagrange-sampling').count(), step >= 1 ? 1 : 0);
      assert.equal(await page.locator('.lagrange-basis-graph').count(), Math.max(0, Math.min(step - 1, 3)));
      assert.equal(await page.locator('.page-toolbar').isVisible(), !recording);
      if (step <= 5) assert.equal(await page.locator('.lagrange-delta-row').count(), 0);
      if (step === 9) {
        const distances = await page.evaluate(() => {
          const dots = [...document.querySelectorAll('[data-role=polynomial-sample]')].map(n => n.getBoundingClientRect());
          return [...document.querySelectorAll('.lagrange-reading > .math-formula')].map((n, i) => {
            const label = n.getBoundingClientRect(), dot = dots[i];
            const scale = document.querySelector('.scene-frame').getBoundingClientRect().width / 1440;
            const gapX = Math.max(0, label.left - dot.right, dot.left - label.right);
            const gapY = Math.max(0, label.top - dot.bottom, dot.top - label.bottom);
            return Math.hypot(gapX, gapY) / scale;
          });
        });
        assert(distances.every(d => d >= 3 && d < 45), `Readouts must be next to sample points: ${distances}`);
      }
      assert(await page.evaluate(() => {
        const frame = document.querySelector('.scene-frame').getBoundingClientRect();
        return document.documentElement.scrollHeight === document.documentElement.clientHeight && frame.left >= 0 && frame.right <= innerWidth + 1 && frame.bottom <= innerHeight + 1 &&
          [...document.querySelectorAll('.polynomial-space, .polynomial-space-label, .lagrange-basis-graph, .lagrange-sampling, .lagrange-polynomial, .lagrange-reading, .lagrange-functionals > div, .lagrange-delta-row')].every(n => {
            const b = n.getBoundingClientRect();
            return b.left >= frame.left && b.right <= frame.right && b.top >= frame.top && b.bottom <= frame.top + frame.height * .84;
          });
      }));
      if (step >= 6 && step <= 8) {
        const row = await page.locator('.lagrange-delta-row annotation').allTextContents();
        assert.deepEqual(row.map(text => Number(text.at(-1))), [0, 1, 2].map(i => Number(i === step - 6)));
        assert.equal(await page.locator('.lagrange-node[data-active=true]').count(), 3);
      }
      assert.equal(await page.locator('.lagrange-polynomial').count(), step >= 9 ? 1 : 0);
      if (step >= 9) assert(await page.locator('.lagrange-reading').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).color === 'rgb(186, 145, 239)')));

      await page.screenshot({ path: `${root}exports/qa-lagrange/${name}-${step}.png` });
    }
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('[data-role=reconstruction-term]').count(), 0);
    assert(await page.locator('.lagrange-basis-graph svg').evaluateAll(nodes => nodes.every(n => !n.dataset.scaleFactor)));
    await page.keyboard.press('1');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('main').getAttribute('data-scene-id'), 'dual-basis-polynomial-space');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('main').getAttribute('data-scene-id'), 'dual-basis-lagrange');
    await page.keyboard.press('2');
    assert.equal(await page.locator('main').getAttribute('data-step'), '1');
    await page.keyboard.press('PageUp');
    assert.equal(await page.locator('main').getAttribute('data-step'), '0');
    await page.keyboard.press('PageDown');
    assert.equal(await page.locator('main').getAttribute('data-step'), '1');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.recording-mode').count(), 0);
  }
  assert.deepEqual(errors, []);
  console.log('Lagrange: nodal identities, polynomial reconstruction, all steps in desktop/narrow/recording, subtitle safety, KaTeX, console and keyboard passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
