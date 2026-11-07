import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { build, preview } from 'vite';

const MODES = [['desktop', 1440, 1000, false], ['narrow', 390, 844, false], ['recording', 1920, 1080, true]];

/**
 * 命令行参数：--scene <id> 只检查这些 Scene（可重复或逗号分隔），--mode <desktop|narrow|recording> 只检查这些尺寸。
 * 都不给时是交付用的全量检查；只给 --scene 时跳过跨越全部 Scene 的前后翻页。
 */
function selection(argv) {
  const { values } = parseArgs({ args: argv, options: { scene: { type: 'string', multiple: true }, mode: { type: 'string', multiple: true } } });
  const list = items => items?.flatMap(item => item.split(',')).map(item => item.trim()).filter(Boolean);
  const modes = list(values.mode);
  for (const mode of modes ?? []) assert(MODES.some(([name]) => name === mode), `未知尺寸 ${mode}，可选 ${MODES.map(([name]) => name).join('、')}`);
  return { scenes: list(values.scene), modes };
}

/** 把有限时长的动画与过渡直接推到结尾；动画结束可能触发新的动画，所以反复推进直到没有剩余。 */
async function settle(page) {
  await page.evaluate(async () => {
    const pending = () => document.getAnimations().filter(animation =>
      animation.effect?.getComputedTiming().iterations !== Infinity &&
      animation.playState !== 'finished' && animation.playState !== 'idle');
    for (let round = 0; round < 50; round++) {
      const animations = pending();
      if (!animations.length) return;
      for (const animation of animations) try { animation.finish(); } catch { /* 无法推进的动画留给下面的等待 */ }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
  });
  // Infinite decorative motion must not prevent checking settled content.
  await page.waitForFunction(() => document.getAnimations().every(animation =>
    animation.effect?.getComputedTiming().iterations === Infinity ||
    animation.playState === 'finished' || animation.playState === 'idle'));
}

// These callbacks stay in each topic: animation continuity before settling,
// mathematical and object-specific assertions after settling.
// beforeStep 在动画推进到结尾之前运行，可以检查中途状态；各尺寸并行运行，回调里的跨步骤状态要按 name 区分。
export async function checkLayout({ root, beforeStep, checkStep, argv = process.argv.slice(2) }) {
  const only = selection(argv);
  const output = path.join(root, 'exports/qa/layout');
  await mkdir(output, { recursive: true });
  // 与录屏检查一致：构建到临时目录，不依赖、也不覆盖项目 dist/。
  const snapshot = await mkdtemp(path.join(tmpdir(), 'scene-layout-'));
  let server;
  let browser;
  try {
    await build({ root, logLevel: 'error', build: { outDir: snapshot, emptyOutDir: true } });
    server = await preview({ root, build: { outDir: snapshot }, preview: { host: '127.0.0.1', port: 0, open: false } });
    const url = `http://127.0.0.1:${server.httpServer.address().port}/`;
    assert((await fetch(url)).ok, '预览服务不可访问');
    browser = await chromium.launch({ channel: process.env.VIDEO_BROWSER ?? 'chrome', headless: true });
    const modes = MODES.filter(([name]) => !only.modes || only.modes.includes(name));
    // 每种尺寸一个独立的浏览器上下文，同时运行。
    const results = await Promise.allSettled(modes.map(mode => checkMode({ browser, url, mode, only, output, beforeStep, checkStep })));
    const failed = results.find(result => result.status === 'rejected');
    if (failed) throw failed.reason;
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.httpServer.close(resolve));
    await rm(snapshot, { recursive: true, force: true });
  }
}

async function checkMode({ browser, url, mode: [name, width, height, recording], only, output, beforeStep, checkStep }) {
  const context = await browser.newContext({ viewport: { width, height } });
  try {
    const page = await context.newPage();
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
    const open = async scene => {
      await page.goto(url + `?${new URLSearchParams({ ...(scene ? { scene } : {}), ...(recording ? { export: '1' } : {}) })}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
    };
    await open();
    const scenes = JSON.parse(await page.locator('main').getAttribute('data-video-scenes'));
    for (const id of only.scenes ?? []) assert(scenes.some(scene => scene.id === id), `未知 Scene ${id}，可选 ${scenes.map(scene => scene.id).join('、')}`);
    const chosen = only.scenes ? scenes.filter(scene => only.scenes.includes(scene.id)) : scenes;
    const states = scenes.flatMap(scene => Array.from({ length: scene.stepCount }, (_, step) => ({ scene: scene.id, step })));
    let count = 0;
    for (const scene of chosen) {
      // 全量检查时一路按右方向键走过全部 Scene；只查部分 Scene 时直接打开每个 Scene。
      if (only.scenes) await open(scene.id);
      for (let step = 0; step < scene.stepCount; step++) {
        const state = { scene: scene.id, step };
        if (count++ && !(only.scenes && step === 0)) await page.keyboard.press('ArrowRight');
        await checkPosition(state);
        const hook = { page, state, name, recording, output };
        try {
          await beforeStep?.(hook);
          await settle(page);
          await checkStep?.(hook);
          await assertLayout(page, `${name}/${state.scene}/${state.step + 1}`, recording);
          assert.deepEqual(errors, [], '页面出现运行时错误');
          await page.screenshot({ path: path.join(output, `${name}-${state.scene}-${state.step}.png`) });
        } catch (error) {
          await page.screenshot({ path: path.join(output, `${name}-${state.scene}-${state.step}-failed.png`) });
          throw error;
        }
      }
    }
    if (!only.scenes) {
      await page.keyboard.press('ArrowRight');
      await checkPosition(states.at(-1));
      for (const state of states.slice(0, -1).reverse()) {
        await page.keyboard.press('ArrowLeft');
        await checkPosition(state);
      }
      await page.keyboard.press('ArrowLeft');
      await checkPosition(states[0]);
    }
    // Check 0 => step 10 and every numeric shortcut, including long scenes.
    for (const scene of chosen) {
      await open(scene.id);
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
    const scope = only.scenes ? `${chosen.map(scene => scene.id).join('、')} 的 ` : '';
    console.log(`${name}: ${scope}${count} 个步骤、布局、KaTeX、${only.scenes ? '' : '前后导航、'}数字跳步、场景切换及 Escape 通过`);
  } finally {
    await context.close();
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
