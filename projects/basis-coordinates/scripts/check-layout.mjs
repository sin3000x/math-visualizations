import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { checkLayout } from '@math-visualizations/video-tools/layout';

await checkLayout({
  root: fileURLToPath(new URL('../', import.meta.url)),
  checkStep: async ({ page, state }) => {
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
  },
});
