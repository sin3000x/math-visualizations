import assert from 'node:assert/strict';
import test from 'node:test';
import { resample, alignRings, pairedContours } from '../lib/animation/contourTransform.ts';
import { readFileSync } from 'node:fs';

test('闭合轮廓等弧长取样，退化点可连续收缩', () => {
  assert.deepEqual(resample([[0, 0], [2, 0], [2, 2], [0, 2]], 4), [[0, 0], [2, 0], [2, 2], [0, 2]]);
  assert.deepEqual(resample([[3, 4]], 3), [[3, 4], [3, 4], [3, 4]]);
});
test('匹配绕向和起点，同一轮廓不会扭转', () => {
  const shape = [[0, 0], [4, 0], [4, 4], [0, 4]];
  const [a, b] = alignRings(shape, [[4, 4], [4, 0], [0, 0], [0, 4]]);
  assert(a.every((p, i) => Math.hypot(p[0] - b[i][0], p[1] - b[i][1]) < 1e-8));
});
test('全部真实资产的源、目标轮廓点数相同，坐标有限', () => {
  const assets = JSON.parse(readFileSync(new URL('../lib/animation/coordinate-shapes.json', import.meta.url)));
  assert.equal(Object.keys(assets).length, 7);
  for (const { from, to } of Object.values(assets)) {
    for (const pair of pairedContours(from, to)) for (const [a, b] of pair.rings) {
      assert.equal(a.length, b.length);
      assert(a.flat().every(Number.isFinite) && b.flat().every(Number.isFinite));
    }
  }
});

test('等号的两横保持上下顺序，不在中点合成一横', () => {
  const assets = JSON.parse(readFileSync(new URL('../lib/animation/coordinate-shapes.json', import.meta.url)));
  const pair = assets['.expansion-equals'];
  const bars = pairedContours(pair.from, pair.to);
  assert.equal(bars.length, 2);
  const ys = bars.map(bar => bar.rings[0].map(ring => ring.reduce((sum, p) => sum + p[1], 0) / ring.length));
  assert(ys[0][0] < ys[1][0] && ys[0][1] < ys[1][1]);
});
