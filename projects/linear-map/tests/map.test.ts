import assert from "node:assert/strict";
import test from "node:test";
import { apply, columnOf, juiceOf, MATRIX, MATRIX_R, MATRIX_S } from "../lib/math/map.ts";
test("columns are images of the ordered input basis", () => {
  for (const m of [MATRIX, MATRIX_S, MATRIX_R]) {
    assert.deepEqual(apply(m, [1,0]), columnOf(m, 0));
    assert.deepEqual(apply(m, [0,1]), columnOf(m, 1));
  }
  assert.deepEqual(juiceOf([1,0]), [2,1,1]);
  assert.deepEqual(juiceOf([0,1]), [1,2,1]);
});
test("the opening machines send the shared bag to their documented outputs", () => {
  assert.deepEqual(juiceOf([2,1]), [5,4,3]);
  assert.deepEqual(apply(MATRIX_S, [2,1]), [3,5,2]);
  assert.deepEqual(apply(MATRIX_R, [2,1]), [4,2,6]);
});
test("T outputs lie in the plane where the third entry is a third of the first two", () => {
  for (const bag of [[2,1],[1,0],[-3,.5]] as const) {
    const [a, b, c] = juiceOf(bag);
    assert(Math.abs(3 * c - (a + b)) < 1e-12);
  }
});
test("linearity includes zero, negative and fractional net quantities", () => {
  for (const a of [-3,0,.5,2]) for (const b of [-2,0,1.5]) {
    const x = juiceOf([a,b]); const y = juiceOf([2,-1]);
    assert.deepEqual(juiceOf([a+2,b-1]), x.map((v,i)=>v+y[i]));
    juiceOf([a*-.5,b*-.5]).forEach((v,i) => assert(Math.abs(v + .5*x[i]) < 1e-12));
  }
});
