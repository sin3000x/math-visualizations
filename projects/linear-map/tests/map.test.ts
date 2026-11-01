import assert from "node:assert/strict";
import test from "node:test";
import { addBags, addJuice, apply, columnOf, juiceOf, MATRIX, MATRIX_R, MATRIX_S, scaleJuice } from "../lib/math/map.ts";
test("columns are images of the ordered input basis", () => {
  for (const m of [MATRIX, MATRIX_S, MATRIX_R]) {
    assert.deepEqual(apply(m, [1,0]), columnOf(m, 0));
    assert.deepEqual(apply(m, [0,1]), columnOf(m, 1));
  }
  assert.deepEqual(juiceOf([1,0]), [2,1,1]);
  assert.deepEqual(juiceOf([0,1]), [1,2,1]);
});
test("the juice space scene adds and doubles trays", () => {
  const sum = addJuice([1,2,1], [2,1,0]);
  assert.deepEqual(sum, [3,3,1]);
  assert.deepEqual(scaleJuice(2, sum), [6,6,2]);
});
test("the map scene sends every bag to its documented tray", () => {
  assert.deepEqual([[2,1],[1,3],[3,0]].map(bag => juiceOf(bag as [number, number])), [[5,4,3],[5,7,4],[6,3,3]]);
});
test("the parallel machines send the shared bag to their documented outputs", () => {
  assert.deepEqual(juiceOf([2,1]), [5,4,3]);
  assert.deepEqual(apply(MATRIX_S, [2,1]), [3,5,2]);
  assert.deepEqual(apply(MATRIX_R, [2,1]), [4,2,6]);
});
test("the linearity scene compares equal trays", () => {
  const u = [1,1] as const, v = [1,0] as const;
  assert.deepEqual(addBags(u, v), [2,1]);
  assert.deepEqual(juiceOf(addBags(u, v)), addJuice(juiceOf(u), juiceOf(v)));
  assert.deepEqual(juiceOf([1,.5]), scaleJuice(.5, juiceOf([2,1])));
  assert.deepEqual(juiceOf([1,.5]), [2.5,2,1.5]);
});
test("one apple tray plus half a banana tray pours into the image of (1, 0.5)", () => {
  assert.deepEqual(addJuice(juiceOf([1,0]), scaleJuice(.5, juiceOf([0,1]))), juiceOf([1,.5]));
});
test("every tray used on screen fits in a nine-unit cup", () => {
  const trays = [[6,6,2],[5,7,4],[6,3,3],[4,2,6],[5,4,3],[2.5,2,1.5],[.5,1,.5]];
  for (const tray of trays) assert(tray.every(v => v >= 0 && v <= 9));
});
test("linearity includes zero, negative and fractional net quantities", () => {
  for (const a of [-3,0,.5,2]) for (const b of [-2,0,1.5]) {
    const x = juiceOf([a,b]); const y = juiceOf([2,-1]);
    assert.deepEqual(juiceOf([a+2,b-1]), x.map((v,i)=>v+y[i]));
    juiceOf([a*-.5,b*-.5]).forEach((v,i) => assert(Math.abs(v + .5*x[i]) < 1e-12));
  }
});
