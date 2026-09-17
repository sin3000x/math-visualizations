import assert from "node:assert/strict";
import test from "node:test";
import { combine, formatQuantity } from "../lib/math/bags.ts";
test("两个单位袋重建正数、负数、分数和零袋", () => {
  for (const [a,b] of [[2,1],[-1,2],[.5,1.5],[0,0],[-.01,0]]) assert.deepEqual(combine(a,b), { apples:a, bananas:b });
});
test("显示保留小量且不产生负零", () => {
  assert.equal(formatQuantity(-0), "0");
  assert.equal(formatQuantity(-.01), "-0.01");
});
