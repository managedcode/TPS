import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileTps, parseTps, TpsKeywords, TpsPlaybackSession, TpsPlayer, TpsSpec, TpsStandalonePlayer, validateTps } from "../../lib/index.js";
import { buildExampleSnapshot, EXAMPLE_FILES, loadExampleSnapshot } from "../../../scripts/example-snapshot-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../..");
const fixturesDir = path.join(rootDir, "SDK", "fixtures");
const expectations = JSON.parse(readFileSync(path.join(fixturesDir, "runtime-expectations.json"), "utf8"));

function readFixture(...parts) {
  return readFileSync(path.join(fixturesDir, ...parts), "utf8");
}

function spokenWords(script) {
  return script.words.filter((word) => word.kind === "word");
}

test("publishes the TPS keyword catalog and spec constants", () => {
  assert.equal(TpsSpec.defaultBaseWpm, 140);
  assert.equal(TpsSpec.defaultEmotion, "neutral");
  assert.equal(TpsSpec.wpmSuffix, "WPM");
  assert.equal(TpsKeywords.tags.pause, "pause");
  assert.ok(TpsKeywords.emotions.includes("motivational"));
  assert.ok(TpsKeywords.deliveryModes.includes("building"));
  assert.ok(TpsKeywords.volumeLevels.includes("loud"));
});

test("compiles the runtime parity fixture into a deterministic state machine", () => {
  const result = compileTps(readFixture("valid", "runtime-parity.tps"));
  assert.equal(result.ok, true);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.script);

  const [segment] = result.script.segments;
  assert.equal(segment.name, expectations.runtimeParity.segmentName);
  assert.equal(segment.emotion, expectations.runtimeParity.segmentEmotion);
  assert.equal(segment.speaker, expectations.runtimeParity.segmentSpeaker);
  assert.equal(segment.archetype, expectations.runtimeParity.segmentArchetype);
  assert.equal(segment.targetWpm, expectations.runtimeParity.baseWpm);

  const block = segment.blocks.find((candidate) => candidate.name === expectations.runtimeParity.blockName);
  assert.ok(block);
  assert.equal(block.emotion, expectations.runtimeParity.blockEmotion);

  const words = Object.fromEntries(spokenWords(result.script).map((word) => [word.cleanText.replace(/[.!?]+$/u, ""), word]));
  assert.equal(words.teleprompter.metadata.speedOverride, expectations.runtimeParity.wordChecks.teleprompter.speedOverride);
  assert.equal(words.teleprompter.metadata.pronunciationGuide, expectations.runtimeParity.wordChecks.teleprompter.pronunciationGuide);
  assert.equal(words.teleprompter.metadata.speaker, expectations.runtimeParity.wordChecks.teleprompter.speaker);
  assert.equal(words.carefully.metadata.speedMultiplier, expectations.runtimeParity.wordChecks.carefully.speedMultiplier);
  assert.equal(words.moment.metadata.volumeLevel, expectations.runtimeParity.wordChecks.moment.volumeLevel);
  assert.equal(words.moment.metadata.deliveryMode, expectations.runtimeParity.wordChecks.moment.deliveryMode);
  assert.equal(words.moment.metadata.isHighlight, expectations.runtimeParity.wordChecks.moment.isHighlight);
  assert.equal(words.announcement.metadata.stressText, expectations.runtimeParity.wordChecks.announcement.stressText);
  assert.equal(words.development.metadata.stressGuide, expectations.runtimeParity.wordChecks.development.stressGuide);
  assert.equal(words.Rise.metadata.articulationStyle, expectations.runtimeParity.wordChecks.Rise.articulationStyle);
  assert.equal(words.Rise.metadata.energyLevel, expectations.runtimeParity.wordChecks.Rise.energyLevel);
  assert.equal(words.Rise.metadata.melodyLevel, expectations.runtimeParity.wordChecks.Rise.melodyLevel);
  assert.equal(words["Now"].metadata.articulationStyle, expectations.runtimeParity.wordChecks["Now."].articulationStyle);

  const pause = result.script.words.find((word) => word.kind === "pause");
  const editPoint = result.script.words.find((word) => word.kind === "edit-point");
  assert.equal(pause.displayDurationMs, expectations.runtimeParity.controlChecks.pauseDurationMs);
  assert.equal(editPoint.metadata.editPointPriority, expectations.runtimeParity.controlChecks.editPointPriority);
  assert.equal(result.script.totalDurationMs, result.script.words.at(-1).endMs);
});

test("validates invalid fixtures with actionable diagnostics", () => {
  for (const [fileName, expectedCodes] of Object.entries(expectations.invalidDiagnostics)) {
    const result = validateTps(readFixture("invalid", fileName));
    assert.equal(result.ok, fileName === "header-parameter.tps");
    assert.deepEqual(result.diagnostics.map((diagnostic) => diagnostic.code), expectedCodes);
    assert.ok(result.diagnostics.every((diagnostic) => diagnostic.range.start.line >= 1));
  }
});

test("parses plain markdown headers, title overrides, implicit segments, and timing hints", () => {
  const source = `---\ntitle: \"Front\"\nbase_wpm: 150\n---\n\n# Display\n\nIntro words.\n\n### Body\nNow read this.\n\n## [Signal|0:30-1:10|Warm|Speaker:Alex]\n### [Callout|160WPM]\nMessage.`;
  const result = parseTps(source);
  assert.equal(result.ok, true);
  assert.equal(result.document.metadata.title, "Display");
  assert.equal(result.document.segments[0].name, "Display");
  assert.equal(result.document.segments[1].timing, "0:30-1:10");
  assert.equal(result.document.segments[1].speaker, "Alex");
  assert.equal(result.document.segments[1].blocks[0].targetWpm, 160);
});

test("accepts front matter closed at EOF and preserves title offsets after leading blank lines", () => {
  const eofFrontMatter = parseTps("---\nbase_wpm: 150\n---");
  assert.equal(eofFrontMatter.ok, true);
  assert.equal(eofFrontMatter.document.metadata.base_wpm, "150");

  const titled = parseTps("---\nbase_wpm: 150\n---\n\n# Display");
  assert.equal(titled.ok, true);
  assert.equal(titled.document.metadata.title, "Display");
  assert.equal(titled.document.segments[0].name, "Display");
});

test("supports nested speed scopes, markdown emphasis, phonetics, and escaped control markers", () => {
  const source = `---\nbase_wpm: 140\n---\n\n## [Signal|focused]\n### [Body]\n[180WPM][slow]*beta*[/slow][normal]**gamma**[/normal][/180WPM] [phonetic:ˈkæməl]camel[/phonetic] literal \\/ slash \\[tag\\]`;
  const result = compileTps(source);
  assert.equal(result.ok, true);
  const words = spokenWords(result.script);
  const beta = words.find((word) => word.cleanText === "beta");
  const gamma = words.find((word) => word.cleanText === "gamma");
  const camel = words.find((word) => word.cleanText === "camel");
  const literal = words.find((word) => word.cleanText === "/");
  assert.equal(beta.metadata.speedOverride, 144);
  assert.equal(beta.metadata.emphasisLevel, 1);
  assert.equal(gamma.metadata.speedOverride, 180);
  assert.equal(gamma.metadata.emphasisLevel, 2);
  assert.equal(camel.metadata.phoneticGuide, "ˈkæməl");
  assert.equal(literal.cleanText, "/");
  assert.ok(words.some((word) => word.cleanText === "[tag]"));
});

test("keeps unknown tags literal and reports malformed authoring", () => {
  const source = `## [Broken|260WPM|Mystery]\n\n### [Body]\n[unknown]tag[/unknown] [edit_point:critical] [slow]dangling`;
  const result = compileTps(source);
  assert.equal(result.ok, false);
  assert.deepEqual(result.diagnostics.map((diagnostic) => diagnostic.code), [
    "invalid-wpm",
    "invalid-header-parameter",
    "unknown-tag",
    "invalid-tag-argument",
    "unclosed-tag"
  ]);
  assert.ok(spokenWords(result.script).some((word) => word.cleanText.includes("[unknown]tag[/unknown]")));
});

test("attaches punctuation and distinguishes slash punctuation from pause markers", () => {
  const result = compileTps("## [Signal|neutral]\n### [Body]\nA/b stays literal. [emphasis]Done[/emphasis], / dash - restored.");
  assert.equal(result.ok, true);
  const words = spokenWords(result.script).map((word) => word.cleanText);
  assert.ok(words.includes("A/b"));
  assert.ok(words.includes("Done,"));
  assert.ok(words.includes("dash -"));
  assert.equal(result.script.words.filter((word) => word.kind === "pause").length, 1);
});

test("compiles direct segment content once when no explicit block headers exist", () => {
  const result = compileTps("## [Intro]\nHello world.");
  assert.equal(result.ok, true);
  assert.deepEqual(result.script.words.map((word) => word.cleanText), ["Hello", "world."]);
  assert.equal(result.script.segments[0].blocks.length, 1);
});

test("player exposes phrase-based presentation and completion state", () => {
  const { script } = compileTps(readFixture("valid", "runtime-parity.tps"));
  const player = new TpsPlayer(script);
  const early = player.getState(0);
  const mid = player.seek(script.totalDurationMs / 2);
  const done = player.getState(script.totalDurationMs);

  assert.equal(early.currentWord.cleanText, "Join");
  assert.ok(mid.presentation.visibleWords.length > 0);
  assert.ok(mid.presentation.activeWordInPhrase >= 0);
  assert.equal(done.isComplete, true);
  assert.equal(done.remainingMs, 0);
  assert.equal(done.nextTransitionMs, script.totalDurationMs);
});

test("accepts the documented example scripts without diagnostics", () => {
  for (const example of EXAMPLE_FILES) {
    const result = compileTps(readFileSync(path.join(rootDir, "examples", example), "utf8"));
    assert.equal(result.ok, true, example);
    assert.deepEqual(result.diagnostics, [], example);
    assert.ok(result.script.words.length > 0, example);
  }
});

test("matches shared compiled and player snapshots for documented examples", () => {
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

test("handles empty content and malformed front matter", () => {
  const empty = compileTps("");
  assert.equal(empty.ok, true);
  assert.equal(empty.script.totalDurationMs, 0);
  assert.equal(empty.script.segments.length, 1);
  assert.equal(new TpsPlayer(empty.script).getState(0).currentWordIndex, -1);

  const invalidFrontMatter = compileTps("---\ntitle: Broken");
  assert.equal(invalidFrontMatter.ok, false);
  assert.equal(invalidFrontMatter.diagnostics[0].code, "invalid-front-matter");
});

test("enumerates player states across the playback timeline", () => {
  const { script } = compileTps(readFixture("valid", "runtime-parity.tps"));
  const player = new TpsPlayer(script);
  const states = Array.from(player.enumerateStates(Math.max(1, Math.round(script.totalDurationMs / 4))));

  assert.ok(states.length >= 2);
  assert.equal(states[0].elapsedMs, 0);
  assert.equal(states.at(-1)?.elapsedMs, script.totalDurationMs);
  assert.equal(states.at(-1)?.isComplete, true);
  assert.throws(() => Array.from(player.enumerateStates(0)), /stepMs/i);
});

test("playback session raises transition events while seeking deterministically", () => {
  const { script } = compileTps("## [Signal]\n### [Body]\nReady now.");
  const session = new TpsPlaybackSession(script, { tickIntervalMs: 5 });
  const statuses = [];
  const words = [];
  let completedCount = 0;

  session.on("statusChanged", (event) => statuses.push(event.status));
  session.on("wordChanged", (event) => words.push(event.state.currentWord?.cleanText));
  session.on("completed", () => {
    completedCount += 1;
  });

  const secondWord = session.seek(script.words[0].endMs);
  const done = session.seek(script.totalDurationMs);

  assert.equal(secondWord.currentWord?.cleanText, "now.");
  assert.equal(done.isComplete, true);
  assert.equal(session.status, "completed");
  assert.deepEqual(words, ["now."]);
  assert.deepEqual(statuses, ["paused", "completed"]);
  assert.equal(completedCount, 1);
  session.dispose();
});

test("playback session can autoplay to completion with its internal timer", async () => {
  const { script } = compileTps("## [Signal]\n### [Body]\nReady.");
  const session = new TpsPlaybackSession(script, { tickIntervalMs: 10 });
  const completed = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("playback did not complete in time")), 3000);
    session.on("completed", (event) => {
      clearTimeout(timeout);
      resolve(event.state);
    });
  });

  session.play();
  const finalState = await completed;

  assert.equal(finalState.isComplete, true);
  assert.equal(session.status, "completed");
  session.dispose();
});

test("playback session exposes standalone controls, speed correction, and snapshot output", () => {
  const { script } = compileTps("## [Intro]\n### [Lead]\nReady.\n### [Close]\nNow.\n## [Wrap]\n### [Body]\nDone.");
  const session = new TpsPlaybackSession(script, { tickIntervalMs: 5, initialSpeedOffsetWpm: -10 });
  const snapshots = [];
  session.on("snapshotChanged", (event) => snapshots.push(event.snapshot));
  const observedSnapshots = [];
  const disposeObservation = session.observeSnapshot((snapshot) => observedSnapshots.push(snapshot));

  assert.equal(session.snapshot.tempo.baseWpm, 140);
  assert.equal(session.snapshot.tempo.effectiveBaseWpm, 130);
  assert.equal(session.snapshot.controls.canIncreaseSpeed, true);

  const nextWord = session.nextWord();
  assert.equal(nextWord.currentWord?.cleanText, "Now.");

  const previousWord = session.previousWord();
  assert.equal(previousWord.currentWord?.cleanText, "Ready.");

  const nextBlock = session.nextBlock();
  assert.equal(nextBlock.currentBlock?.name, "Close");
  assert.equal(session.snapshot.currentBlockIndex, 1);

  const previousBlock = session.previousBlock();
  assert.equal(previousBlock.currentBlock?.name, "Lead");

  const faster = session.increaseSpeed(20);
  assert.equal(faster.tempo.effectiveBaseWpm, 150);
  assert.ok(faster.visibleWords.length > 0);
  assert.equal(faster.focusedWord?.isActive, true);
  assert.equal(observedSnapshots[0]?.state.currentWord?.cleanText, "Ready.");
  assert.ok(observedSnapshots.some((snapshot) => snapshot.tempo.effectiveBaseWpm === 150));
  assert.ok(snapshots.length >= 1);
  disposeObservation();
  session.dispose();
});

test("standalone player compiles source and proxies runtime controls", () => {
  const player = TpsStandalonePlayer.compile("## [Signal]\n### [Body]\nReady now.", { initialSpeedOffsetWpm: 5 });
  const seen = [];
  const dispose = player.onSnapshotChanged((snapshot) => seen.push(snapshot.status));
  const unsubscribe = player.on("snapshotChanged", (event) => seen.push(event.snapshot.status));
  const observedSnapshots = [];
  const disposeObservation = player.observeSnapshot((snapshot) => observedSnapshots.push(snapshot));

  assert.equal(player.ok, true);
  assert.equal(player.status, "idle");
  assert.equal(player.isPlaying, false);
  assert.equal(player.script.words.length, 2);
  assert.equal(player.snapshot.tempo.effectiveBaseWpm, 145);
  assert.equal(player.currentState.currentWord?.cleanText, "Ready");

  player.advanceBy(10);
  player.nextWord();
  assert.equal(player.snapshot.state.currentWord?.cleanText, "now.");
  assert.equal(player.currentState.currentWord?.cleanText, "now.");

  player.decreaseSpeed(5);
  assert.equal(player.snapshot.tempo.effectiveBaseWpm, 140);
  assert.equal(observedSnapshots[0]?.state.currentWord?.cleanText, "Ready");

  dispose();
  unsubscribe();
  disposeObservation();
  player.dispose();
  assert.ok(seen.length >= 1);
});

test("standalone player can restore from compiled script and JSON", () => {
  const compiled = compileTps("## [Signal]\n### [Body]\nReady now.");
  const playerFromScript = TpsStandalonePlayer.fromCompiledScript(compiled.script);
  const playerFromJson = TpsStandalonePlayer.fromCompiledJson(JSON.stringify(compiled.script));
  const canonicalTransport = JSON.parse(readFixture("transport", "runtime-parity.compiled.json"));
  const fromCanonicalTransport = TpsStandalonePlayer.fromCompiledJson(JSON.stringify(canonicalTransport));

  assert.equal(playerFromScript.snapshot.state.currentWord?.cleanText, "Ready");
  assert.equal(playerFromJson.snapshot.state.currentWord?.cleanText, "Ready");
  assert.equal(playerFromJson.script.totalDurationMs, compiled.script.totalDurationMs);
  assert.equal(fromCanonicalTransport.snapshot.state.currentSegment?.name, expectations.runtimeParity.segmentName);
  assert.deepEqual(JSON.parse(JSON.stringify(compileTps(readFixture("valid", "runtime-parity.tps")).script)), canonicalTransport);
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
