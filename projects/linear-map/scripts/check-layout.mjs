import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { checkLayout } from '@math-visualizations/video-tools/layout';
await checkLayout({
  root: fileURLToPath(new URL('../', import.meta.url)),
  beforeStep: async ({ page, state }) => {
    if (state.scene === 'matrix-columns' && state.step === 2) {
      const moves = await page.locator('.moving-column').evaluateAll(nodes => nodes.map(node => {
        const a = node.getAnimations().find(a => a.transitionProperty === 'left');
        if (!a) return false;
        a.pause();
        const read = t => { a.currentTime = t; return parseFloat(getComputedStyle(node).left); };
        const start = read(0), middle = read(500), end = read(1000);
        a.finish();
        return middle > Math.min(start, end) && middle < Math.max(start, end);
      }));
      assert.deepEqual(moves, [true, true], '矩阵两列必须经过连续的中间位置');
    }
  },
  checkStep: async ({ page, state }) => {
    assert.equal(await page.locator('.lesson').getAttribute('data-step'), String(state.step));
    if (state.scene === 'juice-map') {
      assert.equal(await page.locator('[data-role=shared-input]').count(), 1);
      if (state.step < 2) {
        assert.equal(await page.locator('.fruit-bag').count(), 3);
        assert.equal(await page.locator('[data-role=juice]').count(), state.step === 1 ? 3 : 0);
      } else {
        assert.equal(await page.locator('.fruit-bag').count(), 1);
        assert.deepEqual(await page.locator('[data-role=juice]').evaluateAll(nodes => nodes.map(n => n.dataset.values)), ['5,4,3', '3,5,2', '4,2,6'].slice(0, state.step - 1));
      }
    }
    if (state.scene === 'matrix-action' && state.step >= 2)
      assert.equal(await page.locator('[data-role=juice]').getAttribute('data-values'), '5,4,3');
    if (state.scene === 'basis-images' && state.step === 3)
      assert.deepEqual(await page.locator('[data-role=juice]').evaluateAll(nodes => nodes.map(n=>n.dataset.values)), ['2,1,1','1,2,1']);
    if (state.scene === 'linearity')
      assert.equal(await page.locator('.foot-equation').count(), state.step % 2, '线性等式只在合并或加倍完成后出现');
    if (state.scene === 'linearity' && state.step === 1)
      assert.equal(await page.locator('.sum-juice.first [data-role=juice]').getAttribute('data-values'), '3,3,2');
    if (state.scene === 'linearity' && state.step === 3)
      assert.equal(await page.locator('[data-role=juice]').getAttribute('data-values'), '4,2,2');
  },
});
