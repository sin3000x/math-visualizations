import assert from "node:assert/strict";
import test from "node:test";
import { bagsAndCheckoutsScene, bagsFormVectorSpaceScene, getConceptScenes, getScene, scenes, validateSceneRegistry } from "../lib/scenes/registry.ts";
import { bagVectorSpaceStepCount, getIntroFlags, introSteps, vectorSpaceSteps } from "../scenes/content.ts";

test("scene ids and concept orders are unique", () => {
  assert.doesNotThrow(() => validateSceneRegistry(scenes));
  assert.equal(new Set(scenes.map((scene) => scene.id)).size, scenes.length);
});

test("duplicate scene id is rejected", () => {
  assert.throws(() => validateSceneRegistry([scenes[0], scenes[0]]), /Duplicate scene id/);
});

test("duplicate order in the same concept is rejected", () => {
  assert.throws(
    () => validateSceneRegistry([scenes[0], { ...scenes[0], id: "other-scene" }]),
    /Duplicate scene order/,
  );
});

test("dual-space scenes retain their teaching order", () => {
  assert.equal(getScene("bags-and-checkouts").id, bagsAndCheckoutsScene.id);
  assert.equal(bagsAndCheckoutsScene.title, "袋子的世界与收银台的世界");
  assert.deepEqual(
    getConceptScenes("dual-space-episode-1").map((scene) => scene.id),
    ["bags-and-checkouts", "bags-form-vector-space", "checkout-linearity", "checkout-operations", "checkouts-form-vector-space", "dual-space-summary"],
  );
  assert.equal(bagsFormVectorSpaceScene.order, 20);
});

test("the bag vector-space scene has exactly eight axioms", () => {
  assert.equal(vectorSpaceSteps.length, 8);
  assert.deepEqual(
    vectorSpaceSteps.map((step) => step.id),
    [
      "addition-commutative",
      "addition-associative",
      "zero",
      "inverse",
      "scalar-associative",
      "scalar-identity",
      "scalar-distributes-over-vectors",
      "vector-distributes-over-scalars",
    ],
  );
  assert.equal(bagVectorSpaceStepCount, 10);
});

test("intro flags follow the six-step reveal order", () => {
  assert.equal(introSteps.length, 6);
  assert.deepEqual(getIntroFlags(0), {
    showCheckout: false,
    showQuote: false,
    showBagsWorld: false,
    showCheckoutsWorld: false,
    showSpaceNames: false,
  });
  assert.deepEqual(getIntroFlags(2), {
    showCheckout: true,
    showQuote: true,
    showBagsWorld: false,
    showCheckoutsWorld: false,
    showSpaceNames: false,
  });
  assert.deepEqual(getIntroFlags(5), {
    showCheckout: true,
    showQuote: true,
    showBagsWorld: true,
    showCheckoutsWorld: true,
    showSpaceNames: true,
  });
});
