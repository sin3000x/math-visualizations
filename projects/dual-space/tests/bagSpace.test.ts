import assert from "node:assert/strict";
import test from "node:test";
import { addBags, bagsEqual, scaleBag, ZERO_BAG, type BagVector } from "../lib/model/bagSpace.ts";

const u: BagVector = { apples: 2, bananas: 1 };
const v: BagVector = { apples: 1, bananas: 2 };
const w: BagVector = { apples: -1, bananas: 3 };
const a = 2;
const b = -3;

test("bag addition obeys the four additive axioms", () => {
  assert.ok(bagsEqual(addBags(addBags(u, v), w), addBags(u, addBags(v, w))));
  assert.ok(bagsEqual(addBags(u, v), addBags(v, u)));
  assert.ok(bagsEqual(addBags(u, ZERO_BAG), u));
  assert.ok(bagsEqual(addBags(u, scaleBag(-1, u)), ZERO_BAG));
});

test("bag scaling obeys the four scalar axioms", () => {
  assert.ok(bagsEqual(scaleBag(a, addBags(u, v)), addBags(scaleBag(a, u), scaleBag(a, v))));
  assert.ok(bagsEqual(scaleBag(a + b, u), addBags(scaleBag(a, u), scaleBag(b, u))));
  assert.ok(bagsEqual(scaleBag(a, scaleBag(b, u)), scaleBag(a * b, u)));
  assert.ok(bagsEqual(scaleBag(1, u), u));
});

test("a negative component is preserved as a return quantity", () => {
  assert.deepEqual(scaleBag(-1, u), { apples: -2, bananas: -1 });
});
