import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileTps, TpsPlayer } from "../../src/index.ts";
import { buildExampleSnapshot, EXAMPLE_FILES, loadExampleSnapshot } from "../../../scripts/example-snapshot-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../..");

test("source TypeScript runtime matches shared example snapshots", () => {
  for (const example of EXAMPLE_FILES) {
    const source = readFileSync(path.join(rootDir, "examples", example), "utf8");
    const result = compileTps(source);
    assert.equal(result.ok, true, example);
    assert.deepEqual(
      buildExampleSnapshot(example, result.script, script => new TpsPlayer(script)),
      loadExampleSnapshot(rootDir, example),
      example
    );
  }
});

test("source TypeScript player enumerates timeline states", () => {
  const result = compileTps("## [Signal]\n### [Body]\nReady now.");
  assert.equal(result.ok, true);

  const player = new TpsPlayer(result.script);
  const states = Array.from(player.enumerateStates(50));

  assert.ok(states.length >= 2);
  assert.equal(states[0]?.elapsedMs, 0);
  assert.equal(states.at(-1)?.elapsedMs, result.script.totalDurationMs);
  assert.equal(states.at(-1)?.isComplete, true);
  assert.throws(() => Array.from(player.enumerateStates(0)), /stepMs/i);
});
