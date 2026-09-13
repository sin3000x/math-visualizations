import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ preview: { host: '127.0.0.1', port: 0 } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  await mkdir('exports/qa-change-basis', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.locator('.scene-navigation button').last().click();
  await page.evaluate(() => document.fonts.ready);
  for (let step = 0; step < 8; step++) {
    if (step) await page.keyboard.press('ArrowRight');
    if ([2, 5, 6, 7].includes(step)) {
      const motion = await page.evaluate(step => {
        const targets = [...document.querySelectorAll(`[data-flight-step="${step}"]`)];
        const results = targets.map(target => {
          const animation = target.getAnimations()[0];
          if (!animation) throw new Error('数值缺少位移动画');
          animation.pause();
          animation.currentTime = Number(target.dataset.flightDelay ?? 0);
          const from = document.querySelector(`[data-source="${target.dataset.flightSource}"]`).getBoundingClientRect();
          const to = target.getBoundingClientRect();
          const error = Math.hypot(from.x + from.width / 2 - to.x - to.width / 2, from.y + from.height / 2 - to.y - to.height / 2);
          animation.currentTime += 550;
          const midway = target.getBoundingClientRect();
          const travelled = Math.hypot(midway.x + midway.width / 2 - from.x - from.width / 2, midway.y + midway.height / 2 - from.y - from.height / 2);
          animation.finish();
          return { error, travelled };
        });
        return results;
      }, step);
      assert(motion.every(value => value.error < 1 && value.travelled > 40), '每个矩阵数值必须从对应来源实际移动');
      assert.equal(motion.length, step === 2 ? 4 : step === 7 ? 2 : 1);
    }
    await page.waitForFunction(() => document.getAnimations().every(a => ['finished', 'idle'].includes(a.playState)));
    assert.equal(await page.locator('.change-original').count(), 1);
    assert.equal(await page.locator('.change-old-row .change-coefficient').first().isVisible(), step >= 1);
    if (step >= 3) {
      assert.equal(await page.locator('.change-new-row .change-coefficient').first().isVisible(), step >= 4);
      const geometry = await page.evaluate(() => {
        const oldRow = document.querySelector('.change-old-row');
        const newRow = document.querySelector('.change-new-row');
        return {
          alignment: oldRow.querySelector('.change-equals').getBoundingClientRect().x - newRow.querySelector('.change-equals').getBoundingClientRect().x,
          oldColor: getComputedStyle(oldRow.querySelector('.fruit-bag')).borderColor,
          newColor: getComputedStyle(newRow.querySelector('.fruit-bag')).borderColor,
        };
      });
      assert.equal(geometry.alignment, 0);
      assert.notEqual(geometry.oldColor, geometry.newColor);
    }
    const machine = await page.locator('.change-machine').evaluate(machine => {
      const tray = machine.querySelector('.probe-tray').getBoundingClientRect();
      const body = machine.querySelector('.checkout-body').getBoundingClientRect();
      const bag = machine.querySelector('.fruit-bag')?.getBoundingClientRect();
      const prices = machine.querySelector('.probe-prices').getBoundingClientRect();
      const screen = machine.querySelector('.checkout-screen').getBoundingClientRect();
      return { attached: tray.left < body.right && tray.top > body.top && tray.bottom < body.bottom,
        contact: !bag || Math.abs(bag.bottom - tray.top) < 1,
        screen: prices.left >= screen.left && prices.right <= screen.right && prices.top >= screen.top && prices.bottom <= screen.bottom };
    });
    assert(machine.attached && machine.contact && machine.screen, '托盘连接主体、袋底接触、单价位于屏幕内');
    const colors = await page.locator('.change-row').evaluateAll(rows => rows.every(row => {
      const bagColor = getComputedStyle(row.querySelector('.change-labeled-bag .fruit-bag')).borderBottomColor;
      return [...row.querySelectorAll('.change-coefficient, .change-coordinate-vector [data-flight-source]')].every(node => getComputedStyle(node).color === bagColor);
    }));
    assert(colors, `步骤 ${step}: 展开坐标和列坐标必须与各自基袋同色`);
    if (step >= 5) {
      assert.equal(await page.locator('.change-new-row .change-price-vector [data-flight-source]:visible').count(), step === 5 ? 1 : 2);
      assert(await page.locator('.change-quotes').evaluateAll(nodes => nodes.every(node => Number(getComputedStyle(node).opacity) === 0)), '报价移入行向量后不持久展示');
    }
    assert.equal(await page.locator('.katex-error').count(), 0);
    await page.screenshot({ path: `exports/qa-change-basis/step-${step}.png` });
  }
  console.log('8 步通过：基先于坐标、等号对齐、基袋异色、托盘接触、屏幕单价、数值动画来源及中途位移。');
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
