import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { checkLayout } from '@math-visualizations/video-tools/layout';

// 每一步结束后画面上各托盘的读数（不含正在倒出的来源托盘）。
const expectedJuice = {
  'juice-space': ['1,2,1', '1,2,1', '3,3,1', '3,3,1', '6,6,2', '2,0,3|4,1,2|0,3,1|6,6,2'],
  'juice-map': ['2,0,3|4,1,2|0,3,1|6,6,2', '', '5,4,3', '5,4,3|5,7,4', '5,4,3|5,7,4|6,3,3'],
  machines: ['5,4,3|5,7,4|6,3,3', '', '5,4,3|3,5,2|4,2,6'],
  linearity: ['5,4,3|3,5,2|4,2,6', '', '', '3,3,2|2,1,1|5,4,3', '3,3,2|2,1,1|5,4,3', '', '5,4,3|2.5,2,1.5', '5,4,3|2.5,2,1.5'],
  'basis-images': ['5,4,3|2.5,2,1.5', '', '2,1,1|1,2,1', '2,1,1|1,2,1', '2,1,1|1,2,1', '2,1,1|1,2,1|2,1,1|1,2,1', '2,1,1|1,2,1|2,1,1|1,2,1|2.5,2,1.5', '2,1,1|1,2,1|2,1,1|1,2,1|2.5,2,1.5'],
  matrix: [...Array(10).fill('2,1,1|1,2,1'), ...Array(6).fill('')],
  'matrix-vector': ['', '', '', '2.5,2,1.5'],
};

await checkLayout({
  root: fileURLToPath(new URL('../', import.meta.url)),
  beforeStep: async ({ page, state }) => {
    // 第 4、5 步：每个矩阵元素从上方托盘的读数原地复制出发，原读数留在原处。
    if (state.scene === 'matrix' && (state.step === 4 || state.step === 5)) {
      const starts = await page.evaluate(() => {
        const center = node => { const b = node.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.height]; };
        const readings = [...document.querySelectorAll('.tray-reading')].map(center);
        return [...document.querySelectorAll('.matrix-number.copy-fly')].map(node => {
          const a = node.getAnimations().find(a => a.animationName === 'copy-fly');
          if (!a) return false;
          a.pause(); a.currentTime = 0;
          const [x, y] = center(node.querySelector('.katex'));
          a.finish();
          return readings.some(([rx, ry, h]) => Math.hypot(rx - x, ry - y) < h * .3);
        });
      });
      assert.deepEqual(starts, Array(3).fill(true), '矩阵元素必须从托盘读数处复制出发');
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
