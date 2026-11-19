import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { checkLayout } from '@math-visualizations/video-tools/layout';

/*
 * 每一步动画结束后画面上可见的：托盘读数、水果收银台屏幕单价、两台收银台的结算结果（先水果后果汁）。
 * 数值与 lib/math/prices.ts 一致：T 的两列 (2,1,1)、(1,2,1)；g = (1,2,1) 元/份；T*g = (5,6) 元/斤。
 */
const expected = {
  'juice-checkout': {
    juice: ['', '', '5,4,3', '5,4,3'],
    fruitPrices: Array(4).fill('5,3'),
    totals: ['13', '13', '13', '13|16'],
  },
  'no-pushforward': {
    juice: ['5,4,3', '', '2,2,1', '2,2,1', '2,2,1'],
    fruitPrices: Array(5).fill('5,3'),
    totals: ['13|16', '', '', '', ''],
  },
  pullback: {
    juice: ['2,2,1', '', '', '5,4,3', '5,4,3', '5,4,3', '5,4,3'],
    fruitPrices: ['5,3', ...Array(6).fill('?,?')],
    totals: ['', '', '', '', '16', '16|16', '16|16'],
  },
  'dual-map': { juice: ['5,4,3', '', '', '', ''], fruitPrices: Array(5).fill('?,?'), totals: ['16|16', '', '', '', ''] },
  'pulled-prices': {
    juice: ['', '', '2,1,1', '2,1,1', '2,1,1', '1,2,1', '1,2,1', '1,2,1'],
    fruitPrices: ['?,?', '?,?', '?,?', '?,?', '5,?', '5,?', '5,?', '5,6'],
    totals: ['', '', '', '5', '5', '', '6', '6'],
  },
  'two-ways': { juice: ['1,2,1', '5,4,3', '5,4,3', '5,4,3'], fruitPrices: Array(4).fill('5,6'), totals: ['6', '', '16', '16|16'] },
  contravariant: { juice: ['5,4,3', '', '', ''], fruitPrices: ['5,6', '', '', ''], totals: ['16|16', '', '', ''] },
};

const visible = (selector, attribute) => `[...document.querySelectorAll(${JSON.stringify(selector)})].filter(node => {
  for (let n = node; n; n = n.parentElement) if (Number(getComputedStyle(n).opacity) === 0) return false;
  return true;
}).map(node => node.dataset.${attribute}).join('|')`;

await checkLayout({
  root: fileURLToPath(new URL('../', import.meta.url)),
  checkStep: async ({ page, state }) => {
    const where = `${state.scene}/${state.step + 1}`;
    const want = expected[state.scene];
    assert.equal(await page.locator('.lesson').getAttribute('data-step'), String(state.step));
    assert.equal(await page.evaluate(visible('[data-role=juice]', 'values')), want.juice[state.step], `${where}: 托盘读数`);
    assert.equal(await page.evaluate(visible('[data-role=fruit-checkout]', 'prices')), want.fruitPrices[state.step], `${where}: 水果收银台单价`);
    assert.equal(await page.evaluate(visible('[data-role=price], [data-role=juice-price]', 'value')), want.totals[state.step], `${where}: 结算结果`);
    // 屏幕上显示的单价与 data-prices 一致（飞入的数字已落定）。
    const shown = await page.evaluate(() => [...document.querySelectorAll('[data-role=fruit-checkout] [data-source] .katex-html')].map(node => node.textContent.trim()).join(','));
    const prices = await page.evaluate(() => document.querySelector('[data-role=fruit-checkout]')?.dataset.prices ?? '');
    assert.equal(shown, prices, `${where}: 屏幕单价`);
  },
});
