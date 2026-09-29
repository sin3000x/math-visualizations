import assert from "node:assert/strict";
import test from "node:test";
import { createSceneLink, positionFromSearch } from "../sceneLink.ts";

const scenes = [{ id: "intro", stepCount: 2 }, { id: "many-steps", stepCount: 11 }];

test("scene links resolve one-based steps, including stops beyond numeric shortcuts", () => {
  assert.deepEqual(positionFromSearch(scenes, ""), { sceneIndex: 0, step: 0 });
  assert.deepEqual(positionFromSearch(scenes, "?scene=many-steps"), { sceneIndex: 1, step: 0 });
  assert.deepEqual(positionFromSearch(scenes, "?scene=many-steps&step=11"), { sceneIndex: 1, step: 10 });
  assert.deepEqual(positionFromSearch(scenes, "?scene=unknown&step=2"), { sceneIndex: 0, step: 1 });
});

test("scene links clamp numeric bounds and default malformed values to the first step", () => {
  assert.deepEqual(positionFromSearch(scenes, "?scene=many-steps&step=999"), { sceneIndex: 1, step: 10 });
  assert.deepEqual(positionFromSearch(scenes, "?step=0"), { sceneIndex: 0, step: 0 });
  for (const value of ["", "-2", "1.5", "2words", "1e2", "NaN", "Infinity", " 2 ", "9007199254740992"]) {
    assert.deepEqual(positionFromSearch(scenes, `?scene=many-steps&step=${encodeURIComponent(value)}`), { sceneIndex: 1, step: 0 }, value);
  }
});

test("copied links preserve the project path and other parameters and leave export mode", () => {
  const link = createSceneLink("https://example.test/project/?scene=intro&step=1&export=1&theme=dark#notes", "many-steps", 10);
  const url = new URL(link);
  assert.equal(url.pathname, "/project/");
  assert.equal(url.hash, "#notes");
  assert.equal(url.searchParams.get("theme"), "dark");
  assert.equal(url.searchParams.get("export"), null);
  assert.deepEqual(positionFromSearch(scenes, url.search), { sceneIndex: 1, step: 10 });
  assert.equal(url.searchParams.getAll("scene").length, 1);
  assert.equal(url.searchParams.getAll("step").length, 1);
});
