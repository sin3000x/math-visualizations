import assert from "node:assert/strict";
import test from "node:test";
import { bags, checkouts, getQuote } from "../lib/model/market.ts";

test("getQuote uses both fruit rates", () => {
  const bag = bags[0];
  const base = checkouts[0];
  assert.notEqual(
    getQuote(bag, { ...base, appleRate: base.appleRate + 1 }),
    getQuote(bag, base),
  );
  assert.notEqual(
    getQuote(bag, { ...base, bananaRate: base.bananaRate + 1 }),
    getQuote(bag, base),
  );
});

test("the same bag gets different totals at different checkouts", () => {
  const bag = bags[0];
  const quotes = new Set(checkouts.map((checkout) => getQuote(bag, checkout)));
  assert.equal(quotes.size, checkouts.length);
});

test("pairing is linear in the bag", () => {
  const checkout = checkouts[0];
  const left = { id: "left", apples: 1, bananas: 2 };
  const right = { id: "right", apples: 3, bananas: 4 };
  const sum = { id: "sum", apples: 4, bananas: 6 };
  const scaled = { id: "scaled", apples: 2, bananas: 4 };
  assert.equal(getQuote(sum, checkout), getQuote(left, checkout) + getQuote(right, checkout));
  assert.equal(getQuote(scaled, checkout), 2 * getQuote(left, checkout));
});

test("pairing is linear in the checkout", () => {
  const bag = bags[0];
  const left = checkouts[0];
  const right = checkouts[1];
  const sum = {
    ...left,
    id: "sum",
    appleRate: left.appleRate + right.appleRate,
    bananaRate: left.bananaRate + right.bananaRate,
  };
  assert.equal(getQuote(bag, sum), getQuote(bag, left) + getQuote(bag, right));
});
