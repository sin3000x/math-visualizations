import assert from "node:assert/strict";
import test from "node:test";
import { bagOf, FRUIT_PRICES, JUICE_PRICES, juice, priceBag, priceTray, pullback, SAMPLE_BAG, STRAY_TRAY } from "../lib/math/prices.ts";

test("示例袋榨出 (5,4,3)，开场两台收银台分别收 13 元与 16 元", () => {
  assert.deepEqual(juice(SAMPLE_BAG), [5, 4, 3]);
  assert.equal(priceBag(FRUIT_PRICES, SAMPLE_BAG), 13);
  assert.equal(priceTray(JUICE_PRICES, juice(SAMPLE_BAG)), 16);
});

test("反例托盘不是任何一袋榨出来的，榨出来的托盘能找回原袋", () => {
  assert.equal(bagOf(STRAY_TRAY), null);
  assert.deepEqual(bagOf(juice(SAMPLE_BAG)), SAMPLE_BAG);
});

test("T* g 的单价是两只基袋榨汁后的价格 (5, 6)", () => {
  assert.deepEqual(pullback(JUICE_PRICES), [5, 6]);
  assert.equal(priceTray(JUICE_PRICES, juice([1, 0])), 5);
  assert.equal(priceTray(JUICE_PRICES, juice([0, 1])), 6);
});

test("对任意袋子，(T* g)(v) = g(T v)", () => {
  const f = pullback(JUICE_PRICES);
  for (const v of [[2, 1], [0, 0], [-1, 3], [0.5, 2.5]] as const) assert.equal(priceBag(f, v), priceTray(JUICE_PRICES, juice(v)));
});

test("反变：(S∘T)* = T*∘S*", () => {
  // S: W → R²，任取一个线性映射；S*h = h∘S。
  const S = [[1, 0, 2], [0, 3, 1]] as const;
  const h = [4, -1] as const;
  const sStar = [0, 1, 2].map(i => h[0] * S[0][i] + h[1] * S[1][i]) as unknown as readonly [number, number, number];
  const direct = [[1, 0], [0, 1]].map(e => { const w = juice(e as unknown as readonly [number, number]); return h[0] * (S[0][0] * w[0] + S[0][1] * w[1] + S[0][2] * w[2]) + h[1] * (S[1][0] * w[0] + S[1][1] * w[1] + S[1][2] * w[2]); });
  assert.deepEqual(pullback(sStar), direct);
});
