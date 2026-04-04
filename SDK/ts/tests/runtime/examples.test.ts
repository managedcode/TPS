import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileTps, TpsPlaybackSession, TpsPlayer, TpsStandalonePlayer } from "../../src/index.ts";
import { buildExampleSnapshot, EXAMPLE_FILES, loadExampleSnapshot } from "../../../scripts/example-snapshot-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../..");
const fixturesDir = path.join(rootDir, "SDK", "fixtures");

function readFixture(...parts: string[]) {
  return readFileSync(path.join(fixturesDir, ...parts), "utf8");
}

test("source TypeScript runtime matches shared example snapshots", () => {
  for (const example of EXAMPLE_FILES) {
    const source = readFileSync(path.join(rootDir, "examples", example), "utf8");
    const result = compileTps(source);
    assert.equal(result.ok, true, example);
    assert.deepEqual(
      buildExampleSnapshot(example, result.script, {
        playerFactory: (script) => new TpsPlayer(script),
        sessionFactory: (script) => new TpsPlaybackSession(script),
        standaloneFactory: (script) => TpsStandalonePlayer.fromCompiledScript(script)
      }),
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

test("source TypeScript playback session supports deterministic and timed playback", async () => {
  const result = compileTps("## [Signal]\n### [Body]\nReady now.");
  assert.equal(result.ok, true);

  const deterministic = new TpsPlaybackSession(result.script, { tickIntervalMs: 5 });
  const secondWord = deterministic.seek(result.script.words[0].endMs);
  assert.equal(secondWord.currentWord?.cleanText, "now.");
  assert.equal(deterministic.status, "paused");
  deterministic.dispose();

  const timed = new TpsPlaybackSession(result.script, { tickIntervalMs: 10 });
  const completed = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("session did not complete")), 3000);
    timed.on("completed", (event) => {
      clearTimeout(timeout);
      resolve(event.state);
    });
  });

  timed.play();
  const finalState = await completed;
  assert.equal(finalState.isComplete, true);
  assert.equal(timed.status, "completed");
  timed.dispose();
});

test("source TypeScript playback session supports block navigation, speed correction, and snapshots", () => {
  const result = compileTps("## [Intro]\n### [Lead]\nReady.\n### [Close]\nNow.\n## [Wrap]\n### [Body]\nDone.");
  assert.equal(result.ok, true);

  const session = new TpsPlaybackSession(result.script, { initialSpeedOffsetWpm: -10 });
  const observedSnapshots = [];
  const unsubscribe = session.observeSnapshot((snapshot) => observedSnapshots.push(snapshot));
  assert.equal(session.snapshot.tempo.effectiveBaseWpm, 130);

  session.nextBlock();
  assert.equal(session.snapshot.state.currentBlock?.name, "Close");

  session.previousBlock();
  assert.equal(session.snapshot.state.currentBlock?.name, "Lead");

  session.nextWord();
  assert.equal(session.snapshot.state.currentWord?.cleanText, "Now.");

  session.increaseSpeed(20);
  assert.equal(session.snapshot.tempo.effectiveBaseWpm, 150);
  assert.ok(session.snapshot.focusedWord?.isActive);
  assert.equal(observedSnapshots[0]?.state.currentWord?.cleanText, "Ready.");
  assert.ok(observedSnapshots.some((snapshot) => snapshot.tempo.effectiveBaseWpm === 150));
  unsubscribe();
  session.dispose();
});

test("source TypeScript standalone player compiles TPS and exposes a runtime snapshot", () => {
  const player = TpsStandalonePlayer.compile("## [Signal]\n### [Body]\nReady now.");
  const snapshots = [];
  const unsubscribe = player.on("snapshotChanged", (event) => snapshots.push(event.snapshot));
  const observedSnapshots = [];
  const disposeObservation = player.observeSnapshot((snapshot) => observedSnapshots.push(snapshot));

  assert.equal(player.ok, true);
  assert.equal(player.status, "idle");
  assert.equal(player.isPlaying, false);
  assert.equal(player.snapshot.state.currentWord?.cleanText, "Ready");
  player.advanceBy(10);
  player.nextWord();
  assert.equal(player.snapshot.state.currentWord?.cleanText, "now.");
  assert.equal(player.currentState.currentWord?.cleanText, "now.");
  assert.ok(snapshots.length >= 1);
  assert.equal(observedSnapshots[0]?.state.currentWord?.cleanText, "Ready");
  unsubscribe();
  disposeObservation();
  player.dispose();
});

test("source TypeScript standalone player can restore from compiled script and JSON", () => {
  const compiled = compileTps("## [Signal]\n### [Body]\nReady now.");
  const playerFromScript = TpsStandalonePlayer.fromCompiledScript(compiled.script);
  const playerFromJson = TpsStandalonePlayer.fromCompiledJson(JSON.stringify(compiled.script));
  const canonicalTransport = JSON.parse(readFixture("transport", "runtime-parity.compiled.json"));
  const fromCanonicalTransport = TpsStandalonePlayer.fromCompiledJson(JSON.stringify(canonicalTransport));

  assert.equal(playerFromScript.snapshot.state.currentWord?.cleanText, "Ready");
  assert.equal(playerFromJson.snapshot.state.currentWord?.cleanText, "Ready");
  assert.equal(playerFromJson.script.totalDurationMs, compiled.script.totalDurationMs);
  assert.equal(fromCanonicalTransport.snapshot.state.currentSegment?.name, "Call to Action");
  assert.deepEqual(
    JSON.parse(JSON.stringify(compileTps(readFixture("valid", "runtime-parity.tps")).script)),
    canonicalTransport
  );
  assert.throws(() => TpsStandalonePlayer.fromCompiledJson(""), /non-empty string/i);
  assert.throws(() => TpsStandalonePlayer.fromCompiledJson("null"), /script object/i);
  const invalidTransport = structuredClone(canonicalTransport);
  const blockWithPhrase = invalidTransport.segments.flatMap((segment) => segment.blocks).find((block) => block.phrases.length > 0);
  assert.ok(blockWithPhrase);
  blockWithPhrase.phrases[0].words = [];
  assert.throws(() => TpsStandalonePlayer.fromCompiledJson(JSON.stringify(invalidTransport)), /canonical|empty phrase/i);

  playerFromScript.dispose();
  playerFromJson.dispose();
  fromCanonicalTransport.dispose();
});
