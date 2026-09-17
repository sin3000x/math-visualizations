import assert from "node:assert/strict";
import test from "node:test";
import { addCheckouts, quote, scaleCheckout } from "../lib/model/checkoutSpace.ts";
import { addBags, scaleBag } from "../lib/model/bagSpace.ts";

const f = { appleRate: 6, bananaRate: 4 };
const g = { appleRate: 3, bananaRate: 6 };
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);

test("checkout operations agree pointwise and preserve linearity for returns, decimals and zero", () => {
  for (const v of [{ apples: 0, bananas: 0 }, { apples: 2, bananas: 1 }, { apples: -1.5, bananas: 0.5 }, { apples: 0.5, bananas: -0.75 }]) {
    for (const a of [-2, -1, 0, 0.5, 1, 2]) {
      const sum = addCheckouts(f, g);
      const scaled = scaleCheckout(a, f);
      close(quote(sum, v), quote(f, v) + quote(g, v));
      close(quote(scaled, v), a * quote(f, v));
      for (const rule of [sum, scaled]) {
        const u = { apples: 0.25, bananas: -1 };
        close(quote(rule, addBags(u, v)), quote(rule, u) + quote(rule, v));
        close(quote(rule, scaleBag(a, v)), a * quote(rule, v));
      }
    }
  }
  assert.equal(quote(addCheckouts(f, g), { apples: 2, bananas: 1 }), 28);
  assert.equal(quote(scaleCheckout(-1, f), { apples: 2, bananas: 1 }), -16);
});
