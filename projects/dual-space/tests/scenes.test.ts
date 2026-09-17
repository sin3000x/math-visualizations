import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync } from "node:fs";
import { bagVectorSpaceScene, dualSpaceIntroScene, getConceptScenes, getScene, scenes, validateSceneRegistry } from "../lib/scenes/registry.ts";
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
  assert.equal(getScene("DualSpaceIntroScene").id, dualSpaceIntroScene.id);
  assert.equal(dualSpaceIntroScene.title, "袋子的世界与收银台的世界");
  assert.deepEqual(
    getConceptScenes("dual-space-episode-1").map((scene) => scene.id),
    ["DualSpaceIntroScene", "BagVectorSpaceScene", "CheckoutLinearityScene", "CheckoutOperationsScene", "CheckoutVectorSpaceScene", "DualSpaceSummaryScene"],
  );
  assert.equal(bagVectorSpaceScene.order, 20);
});

test("scene ids match scenes/*Scene.tsx filenames", () => {
  const files = readdirSync(new URL("../scenes", import.meta.url))
    .filter((name) => name.endsWith("Scene.tsx"))
    .map((name) => name.replace(/\.tsx$/, ""))
    .sort();
  assert.deepEqual([...scenes.map((scene) => scene.id)].sort(), files);
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

test("intro flags follow the seven-step reveal order", () => {
  assert.equal(introSteps.length, 7);
  assert.deepEqual(getIntroFlags(0), {
    showCheckout: false,
    showQuote: false,
    showBagsWorld: false,
    showCheckoutsWorld: false,
    showLinearSpaceName: false,
    showDualSpaceName: false,
  });
  assert.deepEqual(getIntroFlags(2), {
    showCheckout: true,
    showQuote: true,
    showBagsWorld: false,
    showCheckoutsWorld: false,
    showLinearSpaceName: false,
    showDualSpaceName: false,
  });
  assert.deepEqual(getIntroFlags(5), {
    showCheckout: true,
    showQuote: true,
    showBagsWorld: true,
    showCheckoutsWorld: true,
    showLinearSpaceName: true,
    showDualSpaceName: false,
  });
  assert.deepEqual(getIntroFlags(6), {
    showCheckout: true,
    showQuote: true,
    showBagsWorld: true,
    showCheckoutsWorld: true,
    showLinearSpaceName: true,
    showDualSpaceName: true,
  });
});
