import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { checkLayout } from '@math-visualizations/video-tools/layout';

// 每一步结束后画面上各托盘的读数（不含正在倒出的来源托盘）。
const expectedJuice = {
  'juice-space': ['1,2,1', '1,2,1', '3,3,1', '3,3,1', '6,6,2', '2,0,3|4,1,2|0,3,1|6,6,2'],
  'juice-map': ['2,0,3|4,1,2|0,3,1|6,6,2', '', '5,4,3', '5,4,3|5,7,4', '5,4,3|5,7,4|6,3,3'],
  machines: ['5,4,3|5,7,4|6,3,3', '', '5,4,3|3,5,2|4,2,6'],
  linearity: ['5,4,3|3,5,2|4,2,6', '', '', '5,4,3|3,3,2|2,1,1', '5,4,3|5,4,3', '5,4,3', '5,4,3', '2.5,2,1.5|5,4,3', '2.5,2,1.5|2.5,2,1.5'],
  'basis-images': ['2.5,2,1.5|2.5,2,1.5', '', '2,1,1|1,2,1', '2,1,1|1,2,1', '2,1,1|1,2,1|2,1,1|1,2,1', '2,1,1|1,2,1|2,1,1|0.5,1,0.5', '2,1,1|1,2,1|2.5,2,1.5'],
  matrix: ['2.5,2,1.5|2,1,1|1,2,1', '2,1,1|1,2,1', '', '', '2.5,2,1.5'],
};

await checkLayout({
  root: fileURLToPath(new URL('../', import.meta.url)),
  beforeStep: async ({ page, state }) => {
    if (state.scene === 'matrix' && state.step === 2) {
      const moves = await page.locator('.matrix-number').evaluateAll(nodes => nodes.map(node => {
        const a = node.getAnimations().find(a => a.transitionProperty === 'left');
        if (!a) return false;
        a.pause();
        const read = t => { a.currentTime = t; return parseFloat(getComputedStyle(node).left); };
        const start = read(0), middle = read(500), end = read(1000);
        a.finish();
        return middle > Math.min(start, end) && middle < Math.max(start, end);
      }));
      assert.deepEqual(moves, Array(6).fill(true), '托盘读数必须连续移动到矩阵中');
    }
  },
  checkStep: async ({ page, state }) => {
    assert.equal(await page.locator('.lesson').getAttribute('data-step'), String(state.step));
    const values = await page.locator('[data-role=juice]').evaluateAll(nodes => nodes.filter(node => {
      for (let n = node; n; n = n.parentElement) if (Number(getComputedStyle(n).opacity) === 0) return false;
      return true;
    }).map(node => node.dataset.values).join('|'));
    assert.equal(values, expectedJuice[state.scene][state.step], `${state.scene}/${state.step + 1}: 果汁读数`);
    // 倒完之后，来源托盘必须已经消失。
    const sources = await page.locator('[data-role=juice-source]').evaluateAll(nodes => nodes.filter(node => Number(getComputedStyle(node).opacity) > 0).length);
    const pouring = await page.locator('.juice-tray.pouring').count();
    if (pouring) assert.equal(sources, 0, '倒完后来源托盘仍可见');
  },
});
