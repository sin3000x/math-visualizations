import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
const root = new URL('../', import.meta.url).pathname;
const development = process.env.SPANNING_DEV === '1';
const server = development
 ? await createServer({ root, server: { host: '127.0.0.1', port: 0 } })
 : await preview({ root, preview: { host: '127.0.0.1', port: 0 } });
if (development) await server.listen();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
 const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);
 await page.locator('.scene-navigation button').last().click();
 let inputsBeforeExtraction;
 for (let step = 0; step < 7; step++) {
  if (step) await page.keyboard.press('ArrowRight');
  if (step === 1) {
   const timing = await page.evaluate(() => {
    const machines = [...document.querySelectorAll('.spanning-machine-reveal')];
    const bags = [...document.querySelectorAll('.spanning-evaluation > [data-checkout-placement]')];
    machines.forEach(node => node.getAnimations().forEach(a => { a.pause(); a.currentTime = 400; }));
    bags.forEach(node => node.getAnimations().forEach(a => { a.pause(); a.currentTime = 400; }));
    const hiddenDuringShrink = machines.every(node => Number(getComputedStyle(node).opacity) === 0);
    machines.forEach(node => node.getAnimations().forEach(a => { a.currentTime = 800; }));
    bags.forEach(node => node.getAnimations().forEach(a => { a.currentTime = 800; }));
    const hiddenUntilSettled = machines.every(node => Number(getComputedStyle(node).opacity) === 0);
    document.getAnimations().forEach(a => a.play());
    return { hiddenDuringShrink, hiddenUntilSettled };
   });
   assert(timing.hiddenDuringShrink && timing.hiddenUntilSettled);
  }
  if (step === 2) {
   assert.equal(await page.locator('.spanning-dual [data-checkout-placement]').count(), 0, '输入袋作为整项轮廓变形，不再从左式飞入');
   assert.equal(await page.locator('.spanning-evaluation > [data-checkout-placement]').count(), 3);
   const morph = await page.locator('.spanning-morph-layer').evaluate(layer => {
    const animations = layer.getAnimations({ subtree: true });
    animations.forEach(a => { a.pause(); a.currentTime = 0; });
    const paths = [...layer.querySelectorAll('path')];
    const start = paths.map(p => getComputedStyle(p).d);
    animations.forEach(a => { a.currentTime = 500; });
    const middle = paths.map(p => getComputedStyle(p).d);
    animations.forEach(a => { a.currentTime = 999; });
    const end = paths.map(p => getComputedStyle(p).d);
    animations.forEach(a => { a.currentTime = 500; });
    return { groups: layer.querySelectorAll('[data-contour-transform]').length,
     moving: paths.length > 0 && paths.every((_, i) => start[i] !== middle[i] && middle[i] !== end[i]),
     continuous: animations.every(a => a.effect.getTiming().duration === 1000 && a.effect.getKeyframes().every(frame => !('opacity' in frame) && !('visibility' in frame))),
    };
   });
   assert.equal(morph.groups, 2);
   assert(morph.moving && morph.continuous, '3、2 必须连续补间到完整结算图标');
   for (const [label, time] of [['quarter', 250], ['midpoint', 500], ['three-quarter', 750], ['near-end', 999]]) {
    await page.locator('.spanning-morph-layer').evaluate((layer, time) => layer.getAnimations({ subtree: true }).forEach(a => { a.currentTime = time; }), time);
    await page.screenshot({ path: `exports/qa-layout/spanning-morph-${label}.png` });
   }
   await page.locator('.spanning-morph-layer').evaluate(layer => layer.getAnimations({ subtree: true }).forEach(a => a.play()));
  }
  if (step === 3) {
   assert.equal(await page.locator('.spanning-dual [data-role=morphed-input]').count(), 2, '换序保留两个输入袋');
   assert.equal(await page.locator('.spanning-argument').count(), 0, '换序时不提取共同输入');
  }
  if (step === 4) {
   assert.equal(await page.locator('.spanning-argument').count(), 1, '第二次按键才提取共同输入');
   const movement = await page.locator('.spanning-extraction').evaluate(layer => {
    const nodes = [...layer.children];
    const animations = layer.getAnimations({ subtree: true });
    const boxes = () => nodes.map(node => { const b = node.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width }; });
    animations.forEach(a => { a.pause(); a.currentTime = 0; });
    const start = boxes();
    animations.forEach(a => { a.currentTime = 550; });
    const middle = boxes();
    animations.forEach(a => { a.currentTime = 1099; });
    const end = boxes();
    animations.forEach(a => { a.currentTime = 550; });
    const target = layer.closest('section').querySelector('.spanning-argument');
    const destination = target.getBoundingClientRect();
    return { start, middle, end, destination: { x: destination.x, y: destination.y, width: destination.width },
     visible: getComputedStyle(layer).visibility === 'visible' && nodes.every(node => getComputedStyle(node).visibility === 'visible' && Number(getComputedStyle(node).opacity) > 0),
     targetHidden: getComputedStyle(target).visibility === 'hidden' && [...target.querySelectorAll('.fruit-bag')].every(bag => getComputedStyle(bag).visibility === 'hidden'),
     movingBagCount: [...layer.querySelectorAll('.fruit-bag')].filter(bag => getComputedStyle(bag).visibility === 'visible').length,
     continuous: animations.length === 2 && animations.every(a => a.effect.getTiming().duration === 1100 && a.effect.getKeyframes().every(k => !('opacity' in k) && !('visibility' in k))),
    };
   });
   assert(movement.visible, '移动图层必须真实可见，包括开发模式 StrictMode 的第二次初始化');
   assert(movement.targetHidden, '提取过程中最终袋子及其滚轮子节点必须全部隐藏');
   assert.equal(movement.movingBagCount, 2, '提取过程中只能出现两个移动袋子');
   assert(movement.continuous);
   movement.start.forEach((box, i) => {
    for (const key of ['x', 'y', 'width']) assert(Math.abs(box[key] - inputsBeforeExtraction[i][key]) < 1, '两个起点保持上一帧的真实袋子位置');
    assert(movement.middle[i].y < box.y - 30, '实际抬起袋子，沿弧线提取');
    for (const key of ['x', 'y', 'width']) assert(Math.abs(movement.end[i][key] - movement.destination[key]) < 1, '两袋最终落在共同输入处');
   });
   await page.screenshot({ path: 'exports/qa-layout/spanning-extraction-midpoint.png' });
   await page.locator('.spanning-extraction').evaluate(layer => layer.getAnimations({ subtree: true }).forEach(a => a.play()));
  }
  if (step === 5) {
   assert.equal(await page.locator('.bag-reel-cell:first-child .fruit-bag[data-before-roll]').count(), 2, '开始滚动时保留同一对水果袋 DOM，不替换组件');
   const samples = await page.evaluate(async () => {
    const clock = document.querySelector('.spanning-clock').getAnimations()[0];
    clock.pause();
    const results = [];
    for (let i = 0; i <= 8; i++) {
     clock.currentTime = i * 450 + 100;
     await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
     results.push({ sample: document.querySelector('.spanning-scene').dataset.sample, bags: [...document.querySelectorAll('.evaluation-0 .fruit-bag-reel, .spanning-argument .fruit-bag-reel')].map(bag => bag.getAttribute('aria-label')) });
    }
    return results;
   });
   assert.deepEqual(samples.map(item => item.sample), Array.from({ length: 9 }, (_, i) => String(i)));
   assert(samples.every(item => item.bags.length === 2 && item.bags[0] === item.bags[1]));
   assert.equal(new Set(samples.map(item => item.bags[0])).size, 9);
   const scrolling = await page.evaluate(async () => {
    const clock = document.querySelector('.spanning-clock').getAnimations()[0];
    clock.pause();
    const tracks = [...document.querySelectorAll('[data-role=bag-reel-strip]')];
    const frames = [];
    for (const time of [100, 190, 250, 325, 400, 450, 600]) {
     clock.currentTime = time;
     await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
     frames.push(tracks.map(track => new DOMMatrix(getComputedStyle(track).transform).m42));
    }
    clock.currentTime = 325;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { frames, count: tracks.length };
   });
   assert.equal(scrolling.count, 2);
   assert(scrolling.frames.every(frame => frame[0] === frame[1]), '左右整袋滚动必须同步');
   assert.equal(scrolling.frames[0][0], scrolling.frames[1][0], '到位后停留 0.2 秒');
   assert(scrolling.frames[2][0] > scrolling.frames[3][0] && scrolling.frames[3][0] > scrolling.frames[4][0], '袋子轮廓必须持续向上移动');
   assert.equal(scrolling.frames[5][0], scrolling.frames[6][0]);
   await page.screenshot({ path: 'exports/qa-layout/spanning-bag-roll-midpoint.png' });
   await page.evaluate(() => {
    const clock = document.querySelector('.spanning-clock').getAnimations()[0];
    clock.currentTime = 3800;
    clock.play();
   });
  }
  if (step === 6) {
   const fading = await page.locator('.evaluation-0 > [data-checkout-placement], .spanning-argument').evaluateAll(nodes => {
    const animations = nodes.flatMap(n => n.getAnimations());
    animations.forEach(a => { a.pause(); a.currentTime = 400; });
    return nodes.map(node => ({ opacity: Number(getComputedStyle(node).opacity), value: node.querySelector('.fruit-bag-reel').getAttribute('aria-label') }));
   });
   assert(fading.every(node => node.opacity > 0 && node.opacity < 1));
   assert(fading.every(node => node.value === '水果袋：4 斤苹果，3 斤香蕉'), '淡出时保留滚动结束的最后一袋');
   await page.screenshot({ path: 'exports/qa-layout/spanning-final-fade-midpoint.png' });
   await page.locator('.evaluation-0 > [data-checkout-placement], .spanning-argument').evaluateAll(nodes => nodes.flatMap(n => n.getAnimations()).forEach(a => a.play()));
  }
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState === 'finished' || a.playState === 'idle'));
  if (step === 6) {
   assert(!(await page.locator('.evaluation-0 > [data-checkout-placement]').isVisible()));
   assert(!(await page.locator('.spanning-argument').isVisible()));
   for (const index of [1, 2]) {
    assert(await page.locator(`.evaluation-${index} > [data-checkout-placement]`).isVisible());
    assert(await page.locator(`.dual-${index} .spanning-dual-machine`).isVisible());
   }
  }
  if (step === 3) inputsBeforeExtraction = await page.locator('.spanning-dual [data-role=morphed-input] .fruit-bag').evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width }; }));
  if (step === 4) {
   assert(await page.locator('.spanning-argument .bag-reel-cell:first-child .fruit-bag').isVisible());
   assert(!(await page.locator('.spanning-extraction').isVisible()), '到位后才隐藏重合副本');
   await page.locator('.bag-reel-cell:first-child .fruit-bag').evaluateAll(nodes => nodes.forEach(node => { node.dataset.beforeRoll = 'retained'; }));
  }
  assert.equal(await page.locator('.spanning-formula, .spanning-values, .katex-error').count(), 0);
  const formulas = await page.locator('.spanning-scene annotation').allTextContents();
  assert(!formulas.some(text => /a=|b=/.test(text)));
  assert.equal(await page.locator('.spanning-decomposition').count(), step === 6 ? 1 : 0);
  await page.screenshot({ path: `exports/qa-layout/spanning-${step}.png` });
 }
 await page.keyboard.press('5');
 assert(await page.locator('[data-role="bag-reel-strip"]').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).transform === 'none')), '从分解式回退时恢复第一袋位置');
 await page.keyboard.press('6');
 assert.equal(await page.locator('.spanning-scene').getAttribute('data-sample'), '0', '重播第一帧直接从第一袋开始');
 await page.keyboard.press('4');
 await page.waitForFunction(() => document.getAnimations().every(a => a.playState === 'finished' || a.playState === 'idle'));
 await page.keyboard.press('3');
 const targets = await page.locator('.spanning-dual').evaluateAll(nodes => nodes.map(node => {
  const scene = node.closest('section').getBoundingClientRect();
  return (node.getBoundingClientRect().left - scene.left) / (scene.width / 1440);
 }));
 assert(targets.every((x, i) => Math.abs(x - [355, 920][i]) < .1), '回退后的补间终点与实际图标位置一致');
 await page.keyboard.press('4');
 assert.equal(await page.locator('.spanning-morph-layer svg').count(), 0, '快速跳步清理补间图层');
 await page.keyboard.press('5');
 await page.keyboard.press('4');
 assert.equal(await page.locator('.spanning-extraction').count(), 0, '回退清理提取动画');
 assert(await page.locator('.dual-1 [data-role=morphed-input]').isVisible());
 assert(await page.locator('.dual-2 [data-role=morphed-input]').isVisible());
 // 任意线性泛函的两个取值决定其在所有坐标上的作用；包括负数与零。
 for (const [p, q] of [[0, 0], [2, 5], [-3, .5]]) for (const [a, b] of [[3, 2], [0, 0], [-2, 4], [.5, -1]]) {
  const f = ([x, y]) => p * x + q * y;
  assert.equal(f([a, b]), f([1, 0]) * a + f([0, 1]) * b);
 }
 console.log(`${development ? '开发 StrictMode' : '生产预览'}：提取袋可见、运动轨迹、回退清理、8 次整袋同步滚动通过`);
} finally { await browser.close(); if (development) await server.close(); else await new Promise(resolve => server.httpServer.close(resolve)); }
