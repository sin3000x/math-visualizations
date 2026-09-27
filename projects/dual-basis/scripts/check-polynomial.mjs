import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'exports/qa-polynomial');
const sceneId = 'dual-basis-polynomial-space';
const readingLatex = ['p(0)', "p'(0)", "\\frac{p''(0)}{2}"];

// 系数取四分之一的整数倍；先用整数分子精确检查积分，再检查不同 x 的重构。
for (const numerators of [[0, 0, 0], [4, 8, -4], [12, -8, 0], [8, -4, 12], [-8, 2, -1]]) {
  const [a0, a1, a2] = numerators.map(value => value / 4);
  const p = x => a0 + a1 * x + a2 * x * x;
  const derivative = x => a1 + 2 * a2 * x;
  const secondDerivative = 2 * a2;
  for (const x of [-2, -0.5, 0, 0.25, 1, 2]) {
    assert.equal(p(x), p(0) + derivative(0) * x + secondDerivative / 2 * x * x);
  }
  const [n0, n1, n2] = numerators.map(BigInt);
  const integralNumerator = 6n * n0 + 3n * n1 + 2n * n2;
  const integral = Number(integralNumerator) / 24;
  const dualExpansion = p(0) + derivative(0) / 2 + secondDerivative / 6;
  const simpsonIntegral = (p(0) + 4 * p(0.5) + p(1)) / 6;
  assert(Math.abs(integral - dualExpansion) < 1e-12);
  assert(Math.abs(integral - simpsonIntegral) < 1e-12, '独立的二次多项式精确积分必须一致');
}
console.log('数学检查：零、负数、分数和一般二次多项式的系数重构及积分恒等式通过');

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

  const position = async step => {
    await page.waitForFunction(({ sceneId, step }) => {
      const main = document.querySelector('main');
      return main.dataset.sceneId === sceneId && main.dataset.step === String(step);
    }, { sceneId, step });
  };
  const settle = () => page.waitForFunction(() => document.getAnimations().every(animation =>
    animation.playState === 'finished' || animation.playState === 'idle'));

  for (const [name, width, height, recording] of [
    ['desktop', 1440, 1000, false], ['narrow', 390, 844, false], ['recording', 1920, 1080, true],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${url}?scene=${sceneId}${recording ? '&export=1' : ''}`);
    await page.evaluate(() => document.fonts.ready);
    const registered = JSON.parse(await page.locator('main').getAttribute('data-video-scenes'));
    assert.equal(registered.find(scene => scene.id === sceneId).stepCount, 10);

    for (let step = 0; step < 10; step++) {
      if (step) await page.keyboard.press('ArrowRight');
      await position(step);
      if (step === 3) {
        const motion = await page.locator('.polynomial-basis-token').evaluateAll(nodes => {
          const transitions = nodes.map(node => node.getAnimations().filter(animation => animation instanceof CSSTransition));
          const animations = document.querySelector('.polynomial-scene').getAnimations({ subtree: true });
          const frames = [0, 500, 1000].map(time => {
            animations.forEach(animation => { animation.pause(); animation.currentTime = time; });
            return nodes.map(node => {
              const style = getComputedStyle(node);
              return { left: parseFloat(style.left), top: parseFloat(style.top), opacity: Number(style.opacity) };
            });
          });
          animations.forEach(animation => { animation.currentTime = 500; });
          return {
            retained: nodes.map(node => node.dataset.qaContinuity), frames,
            transitions: transitions.map(items => items.map(animation => ({
              property: animation.transitionProperty,
              values: animation.effect.getKeyframes().map(frame => frame[animation.transitionProperty]),
            }))),
          };
        });
        assert.equal(motion.frames[0].length, 3);
        const fromLeft = [180, 300, 420];
        const toLeft = [385, 785, 1145];
        const fromTop = 425;
        motion.frames[0].forEach((start, index) => {
          assert.equal(motion.retained[index], `${step - 1}-${index}`, '移动必须保留上一步的同一 DOM 节点');
          assert.deepEqual(motion.transitions[index].find(item => item.property === 'top')?.values, [`${fromTop}px`, '245px']);
          assert.deepEqual(motion.transitions[index].find(item => item.property === 'left')?.values, [`${fromLeft[index]}px`, `${toLeft[index]}px`]);
          const middle = motion.frames[1][index], end = motion.frames[2][index];
          assert.equal(start.top, fromTop);
          assert.equal(start.left, fromLeft[index]);
          assert.equal(end.top, 245);
          assert.equal(end.left, toLeft[index]);
          assert(middle.top < start.top && middle.top > end.top, '对象必须经过垂直中间位置');
          assert(middle.left > Math.min(start.left, end.left) && middle.left < Math.max(start.left, end.left), '对象必须经过水平中间位置');
        });
        await page.screenshot({ path: path.join(output, `${name}-step-${step}-midpoint.png`) });
        await page.evaluate(() => document.querySelector('.polynomial-scene').getAnimations({ subtree: true }).forEach(animation => animation.finish()));
      }
      if (step === 7) {
        await page.waitForFunction(() => [...document.querySelectorAll('.polynomial-extracted-coefficient')].every(node =>
          node.getAnimations().some(animation => !(animation instanceof CSSTransition) && !(animation instanceof CSSAnimation))));
        const flight = await page.locator('.polynomial-extracted-coefficient').evaluateAll(nodes => {
          const animations = nodes.map(node => node.getAnimations().find(animation =>
            !(animation instanceof CSSTransition) && !(animation instanceof CSSAnimation)));
          const serialize = node => {
            const rect = node.getBoundingClientRect();
            return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          };
          const frames = [0, 125, 250, 375, 500].map(time => {
            animations.forEach(animation => { animation.pause(); animation.currentTime = time; });
            return nodes.map(node => serialize(node.querySelector('.math-formula')));
          });
          animations.forEach(animation => { animation.currentTime = 500; });
          return {
            retained: nodes.map(node => node.dataset.qaContinuity),
            previous: nodes.map(node => JSON.parse(node.dataset.qaStartPosition)),
            targets: nodes.map((_, index) => serialize(document.querySelector(`[data-role=polynomial-source-coefficient][data-coefficient-index="${index}"]`))),
            durations: animations.map(animation => animation.effect.getComputedTiming().activeDuration),
            easings: animations.map(animation => animation.effect.getTiming().easing),
            frames,
          };
        });
        assert.equal(flight.frames[0].length, 3);
        flight.frames[0].forEach((start, index) => {
          assert.equal(flight.retained[index], `6-${index}`, '紫色读数必须复用第 6 步的同一个节点');
          assert.equal(flight.durations[index], 500);
          assert.equal(flight.easings[index], 'linear', '紫色读数须匀速直线代回');
          assert(Math.abs(start.left - flight.previous[index].left) < .5 && Math.abs(start.top - flight.previous[index].top) < .5, '紫色读数不能先跳位再开始移动');
          const end = flight.frames[4][index];
          const dx = end.left - start.left, dy = end.top - start.top;
          assert(dy < -1, '读数必须从下方移回上方展开式');
          flight.frames.forEach((frame, frameIndex) => {
            const point = frame[index], ratio = frameIndex / 4;
            assert(Math.abs(point.left - (start.left + dx * ratio)) < .5, `第 ${index + 1} 个读数横向位移必须与时间成正比`);
            assert(Math.abs(point.top - (start.top + dy * ratio)) < .5, `第 ${index + 1} 个读数纵向位移必须与时间成正比`);
            const lineDistance = Math.abs((point.left - start.left) * dy - (point.top - start.top) * dx) / Math.hypot(dx, dy);
            assert(lineDistance < .5, '每一采样点都必须位于起终点连成的直线上');
          });
          const target = flight.targets[index];
          assert(Math.abs(end.left + end.width / 2 - target.left - target.width / 2) < 1 &&
            Math.abs(end.top + end.height / 2 - target.top - target.height / 2) < 1, '读数最终必须落在上方对应系数槽位中心');
        });
        for (const [label, time] of [['quarter', 125], ['midpoint', 250], ['three-quarter', 375]]) {
          await page.locator('.polynomial-extracted-coefficient').evaluateAll((nodes, time) => nodes.forEach(node => node.getAnimations().forEach(animation => { animation.currentTime = time; })), time);
          await page.screenshot({ path: path.join(output, `${name}-step-7-${label}.png`) });
        }
        await page.locator('.polynomial-extracted-coefficient').evaluateAll(nodes => nodes.forEach(node => node.getAnimations().forEach(animation => animation.finish())));
      }
      if (step >= 4 && step <= 6) {
        const coefficientIndex = step - 4;
        const selector = `[data-role=polynomial-reading-coefficient][data-coefficient-index="${coefficientIndex}"]`;
        await page.waitForFunction(selector => document.querySelector(selector)?.getAnimations({ subtree: true }).some(animation =>
          !(animation instanceof CSSTransition) && !(animation instanceof CSSAnimation)), selector);
        const flight = await page.locator(selector).evaluate((node, coefficientIndex) => {
          const animation = node.getAnimations({ subtree: true }).find(animation =>
            !(animation instanceof CSSTransition) && !(animation instanceof CSSAnimation));
          const source = document.querySelector(`.polynomial-symbolic-coefficient.polynomial-column-${coefficientIndex} .math-formula`);
          const serialize = element => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
          };
          node.dataset.qaFlightIdentity = String(coefficientIndex);
          animation.pause();
          const frames = [0, 500, 1000].map(time => {
            animation.currentTime = time;
            return serialize(node.querySelector('.math-formula'));
          });
          animation.currentTime = 500;
          return {
            source: serialize(source), frames,
            duration: animation.effect.getComputedTiming().activeDuration,
            keyframes: animation.effect.getKeyframes().map(frame => frame.transform),
            latex: node.querySelector('annotation').textContent,
          };
        }, coefficientIndex);
        assert.equal(flight.duration, 1000, '系数从上方飞入等式需要完整 1 秒');
        assert.equal(flight.latex, `a_${coefficientIndex}`);
        assert(flight.keyframes[0] !== flight.keyframes.at(-1), '系数必须执行平移，不能仅淡入');
        const [start, middle, end] = flight.frames;
        assert(Math.abs(start.left - flight.source.left) < 1 && Math.abs(start.top - flight.source.top) < 1, '飞行起点必须是上方对应系数的实际位置');
        assert(middle.top > start.top && middle.top < end.top, '系数必须经过上下两行间的中间位置');
        assert(middle.left > Math.min(start.left, end.left) && middle.left < Math.max(start.left, end.left), '系数必须连续移动到等式右侧');
        await page.screenshot({ path: path.join(output, `${name}-step-${step}-coefficient-midpoint.png`) });
        await page.locator(selector).evaluate(node => node.getAnimations({ subtree: true }).forEach(animation => animation.finish()));
        assert.equal(await page.locator(selector).getAttribute('data-qa-flight-identity'), String(coefficientIndex), '飞行结束必须保留同一个系数节点');
      }
      if (step === 9) {
        const flights = await page.locator('.polynomial-integral-result .polynomial-dual-value').evaluateAll(nodes => nodes.map((node, index) => {
          const animation = node.getAnimations()[0];
          const rect = element => { const r = element.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width }; };
          const source = rect(document.querySelector(`[data-role="polynomial-extracted-coefficient"][data-coefficient-index="${index}"]`));
          const frames = [0, 250, 500].map(time => { animation.pause(); animation.currentTime = time; return rect(node); });
          animation.currentTime = 250;
          return { source, frames, duration: animation.effect.getTiming().duration };
        }));
        assert.equal(flights.length, 3);
        for (const { source, frames: [start, middle, end], duration } of flights) {
          assert.equal(duration, 500);
          assert(Math.hypot(start.x - source.x, start.y - source.y) < 1, '积分读数从上方对应项飞出');
          assert(Math.abs(start.width - source.width) < 1, '飞出时保持原公式大小');
          assert(Math.hypot(middle.x - (start.x + end.x) / 2, middle.y - (start.y + end.y) / 2) < 1, '积分读数沿直线路径飞行');
        }
        await page.screenshot({ path: path.join(output, `${name}-step-9-midpoint.png`) });
        await page.locator('.polynomial-integral-result').evaluate(node => node.getAnimations({ subtree: true }).forEach(animation => animation.finish()));
      }
      await settle();
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.equal(await page.locator('[data-role=monomial-basis]').count(), step >= 2 ? 1 : 0);
      assert.equal(await page.locator('[data-role=polynomial-expansion]').count(), step >= 3 ? 1 : 0);
      assert.equal(await page.locator('[data-role=polynomial-coefficient-reading]').count(), Math.max(0, Math.min(3, step - 3)));
      assert.equal(await page.locator('[data-role=polynomial-integral-expansion]').count(), step >= 8 ? 1 : 0);
      assert.equal(await page.locator('.polynomial-power, .polynomial-basis-bracket').count(), 0, '不得复制幂因子或保留旧下划线');
      if (step >= 2) {
        assert.deepEqual(await page.locator('.polynomial-basis-token annotation').allTextContents(), ['1', 'x', 'x^2']);
        const opacity = await page.locator('.polynomial-basis-token').evaluateAll(nodes => nodes.map(node => Number(getComputedStyle(node).opacity)));
        assert.deepEqual(opacity, step >= 3 ? [0, 1, 1] : [1, 1, 1]);
        assert(await page.locator('[data-role=monomial-basis]').evaluate(basis => {
          const expected = getComputedStyle(basis).color;
          return [...basis.querySelectorAll('.polynomial-basis-token')].every(token => getComputedStyle(token).color === expected);
        }), '基元素飞入展开式后必须保持原黄色');
      }
      if (step >= 4) assert.deepEqual(await page.locator('.polynomial-extracted-coefficient annotation').allTextContents(), readingLatex.slice(0, step - 3));
      if (step >= 4 && step <= 6) {
        const equations = await page.locator('[data-role=polynomial-coefficient-reading]').evaluateAll(nodes => {
          const frame = document.querySelector('.scene-frame').getBoundingClientRect();
          const scale = frame.width / 1440;
          return nodes.map(node => {
            const boxes = [...node.querySelectorAll('.katex-html > .katex-base')].map(base => base.getBoundingClientRect());
            const left = Math.min(...boxes.map(rect => rect.left));
            const right = Math.max(...boxes.map(rect => rect.right));
            const coefficient = node.querySelector('[data-role=polynomial-reading-coefficient]').getBoundingClientRect();
            const readout = node.querySelector('.polynomial-extracted-coefficient').getBoundingClientRect();
            const baselines = [...node.querySelectorAll('.math-formula')].map(formula => {
              const strut = formula.querySelector('.katex-html > .katex-base > .katex-strut');
              return strut.getBoundingClientRect().bottom / scale + (parseFloat(getComputedStyle(strut).verticalAlign) || 0);
            });
            return {
              index: Number(node.dataset.coefficientIndex), center: ((left + right) / 2 - frame.left) / scale,
              coefficientOnRight: coefficient.left > readout.right,
              latex: [...node.querySelectorAll('annotation')].map(item => item.textContent),
              baselineSpread: Math.max(...baselines) - Math.min(...baselines),
            };
          });
        });
        equations.forEach(equation => {
          assert(Math.abs(equation.center - [320, 720, 1120][equation.index]) < 1, '整条读系数等式的字形联合边界必须在所属列居中');
          assert(equation.coefficientOnRight, '飞入后的系数必须留在读数等式右侧');
          assert.deepEqual(equation.latex, [readingLatex[equation.index], '=', `a_${equation.index}`]);
          assert(equation.baselineSpread < 1, `第 ${equation.index + 1} 条等式的读数、等号与系数须共用基线，实际偏差 ${equation.baselineSpread.toFixed(3)}px`);
        });
        if (step === 6) {
          assert(Math.abs(equations[1].center - 720) < 1);
          assert(Math.abs(equations[0].center + equations[2].center - 1440) < 1, '左右两条等式必须围绕画布中心对称');
          if (recording) console.log(`三条等式内部基线偏差（设计像素）：${equations.map(equation => equation.baselineSpread.toFixed(3)).join('、')}`);
        }
      }
      if (step === 2 || step === 6) {
        const selector = step === 2 ? '.polynomial-basis-token' : '.polynomial-extracted-coefficient';
        await page.locator(selector).evaluateAll((nodes, step) => nodes.forEach((node, index) => {
          node.dataset.qaContinuity = `${step}-${index}`;
          const rect = node.querySelector('.math-formula').getBoundingClientRect();
          node.dataset.qaStartPosition = JSON.stringify({ left: rect.left, top: rect.top });
        }), step);
      }
      if (step === 8) assert.equal(await page.locator('[data-role=polynomial-integral-result]').isVisible(), false, '先单独展示积分');
      if (step === 9) assert.deepEqual(await page.locator('[data-role=polynomial-integral-expansion] annotation').allTextContents(), [
        '\\displaystyle\\int_0^1\\textcolor{#62d2c3}{p(x)}\\,\\mathrm{d}x', '=', 'p(0)', '+\\frac12', "p'(0)", '+\\frac13', "\\frac{p''(0)}{2}",
      ]);

      const bounds = await page.evaluate(() => {
        const frame = document.querySelector('.scene-frame').getBoundingClientRect();
        const scale = frame.width / 1440;
        const visible = element => {
          for (let node = element; node && node !== document.body; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
          }
          return true;
        };
        const formulas = [...document.querySelectorAll('.polynomial-scene .math-formula')].filter(visible);
        // KaTeX 的 strut 记录真实数学高度/深度；外层行框在大积分与省略号间会重叠。
        const rects = formulas.map(node => ({
          latex: node.querySelector('annotation')?.textContent,
          boxes: [...node.querySelectorAll('.katex-html > .katex-base')].map(base => {
            const horizontal = base.getBoundingClientRect();
            const vertical = base.querySelector(':scope > .katex-strut')?.getBoundingClientRect() ?? horizontal;
            return { left: horizontal.left, right: horizontal.right, top: vertical.top, bottom: vertical.bottom };
          }),
        }));
        const overlaps = [];
        rects.forEach((first, i) => rects.slice(i + 1).forEach(second => {
          if (first.boxes.some(a => second.boxes.some(b =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > scale &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > scale))) {
            overlaps.push({ first: first.latex, second: second.latex, firstBoxes: first.boxes, secondBoxes: second.boxes });
          }
        }));
        const content = [...document.querySelectorAll('.polynomial-space, .polynomial-space-label, .polynomial-basis-token, .polynomial-scene .math-formula')].filter(visible);
        const purple = document.querySelector('.polynomial-functionals .polynomial-space-label');
        const purpleColor = purple && getComputedStyle(purple).color;
        return {
          noScroll: document.documentElement.scrollHeight === document.documentElement.clientHeight && document.documentElement.scrollWidth === document.documentElement.clientWidth,
          inside: frame.left >= 0 && frame.top >= 0 && frame.right <= innerWidth + 1 && frame.bottom <= innerHeight + 1,
          ratio: frame.width / frame.height,
          overflow: rects.filter(({ boxes }) => boxes.some(rect => rect.left < frame.left - 1 || rect.top < frame.top - 1 || rect.right > frame.right + 1 || rect.bottom > frame.bottom + 1)).map(item => item.latex),
          subtitleSafe: content.every(node => node.getBoundingClientRect().bottom <= frame.top + frame.height * .84 + 1),
          overlaps,
          purpleCoefficients: [...document.querySelectorAll('.polynomial-extracted-coefficient, .polynomial-dual-value')].every(node => getComputedStyle(node).color === purpleColor),
          controls: document.querySelector('.scene-frame').querySelectorAll('nav, button').length,
        };
      });
      await page.screenshot({ path: path.join(output, `${name}-step-${step}.png`) });
      assert(bounds.noScroll && bounds.inside, `${name} step ${step}: 画布超出视口`);
      assert(Math.abs(bounds.ratio - 16 / 9) < .01);
      assert.deepEqual(bounds.overflow, [], `${name} step ${step}: 可见公式超出画布`);
      assert.deepEqual(bounds.overlaps, [], `${name} step ${step}: 可见公式重叠`);
      assert(bounds.subtitleSafe, `${name} step ${step}: 内容进入底部 16% 字幕安全区`);
      assert(bounds.purpleCoefficients, '系数读数必须保持紫色');
      assert.equal(bounds.controls, 0);
      assert.equal(await page.locator('.page-toolbar').isVisible(), !recording);
      if (!recording) assert(await page.locator('.scene-navigation').evaluate(nav => {
        const frame = document.querySelector('.scene-frame').getBoundingClientRect();
        return nav.scrollWidth <= nav.clientWidth && [...nav.querySelectorAll('button')].every(button => {
          const rect = button.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= frame.top;
        });
      }), `${name}: 导航必须换行且位于画布外`);
    }

    for (let step = 8; step >= 0; step--) {
      await page.keyboard.press('ArrowLeft');
      await position(step);
    }
    for (const [key, step] of [['9', 8], ['4', 3], ['1', 0]]) {
      await page.keyboard.press(key);
      await position(step);
    }
    await page.keyboard.press('PageDown');
    await position(1);
    await page.keyboard.press('PageUp');
    await position(0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.recording-mode').count(), 0);
    assert.equal(await page.locator('.scene-navigation button[aria-current]').textContent(), 'PolynomialDualSpaceScene');
    console.log(`${name}: 10 步布局、基与读数代回、3 次系数飞行、等式居中、可见公式、字幕区、导航和截图通过`);
  }
  assert.deepEqual(errors, [], '控制台不得新增错误');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
