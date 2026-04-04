import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCompiledScript, parseCompiledScriptJson } from "../../lib/compiled-script.js";
import { compileContent } from "../../lib/content-compiler.js";
import { createDiagnostic, createLineStarts, hasErrors, normalizeLineEndings, positionAt, rangeAt } from "../../lib/diagnostics.js";
import { protectEscapes, restoreEscapes, splitHeaderParts, splitHeaderPartsDetailed } from "../../lib/escaping.js";
import { compileTps, parseTps } from "../../lib/compiler.js";
import { TpsDiagnosticCodes, TpsSpec } from "../../lib/constants.js";
import { buildStandalonePunctuationSuffix, isStandalonePunctuationToken } from "../../lib/text-rules.js";
import {
  buildInvalidWpmMessage,
  calculateOrpIndex,
  calculateWordDurationMs,
  isInvalidWpm,
  isKnownEmotion,
  isKnownInlineTag,
  isLegacyMetadataKey,
  isSentenceEndingPunctuation,
  isTimingToken,
  isValidationErrorCode,
  normalizeValue,
  resolveBaseWpm,
  resolveEffectiveWpm,
  resolveEmotion,
  resolvePalette,
  resolveSpeedMultiplier,
  resolveSpeedOffsets,
  tryParseAbsoluteWpm,
  tryResolvePauseMilliseconds
} from "../../lib/runtime-helpers.js";
import { TpsPlaybackSession } from "../../lib/playback-session.js";
import { TpsPlayer } from "../../lib/player.js";

function inherited() {
  return {
    targetWpm: TpsSpec.defaultBaseWpm,
    emotion: TpsSpec.defaultEmotion,
    speedOffsets: resolveSpeedOffsets({})
  };
}

test("covers low-level helpers and spec math", () => {
  assert.equal(normalizeLineEndings(null), "");
  assert.equal(normalizeLineEndings("a\r\nb\rc"), "a\nb\nc");
  assert.deepEqual(createLineStarts("a\nbc"), [0, 2]);
  assert.deepEqual(positionAt(2, [0, 2]), { line: 2, column: 1, offset: 2 });
  assert.deepEqual(rangeAt(0, 2, [0, 2]), {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 2, column: 1, offset: 2 }
  });
  assert.equal(hasErrors([createDiagnostic(TpsDiagnosticCodes.invalidHeaderParameter, "warn", 0, 1, [0])]), false);
  assert.equal(hasErrors([createDiagnostic(TpsDiagnosticCodes.invalidPause, "err", 0, 1, [0])]), true);

  assert.equal(restoreEscapes(protectEscapes("\\[tag\\] \\/ \\\\ \\*")), "[tag] / \\ *");
  assert.deepEqual(splitHeaderParts("Title\\|Pipe|Speaker:Alex"), ["Title|Pipe", "Speaker:Alex"]);
  assert.deepEqual(splitHeaderPartsDetailed("One|Two\\|Three"), [
    { value: "One", start: 0, end: 3 },
    { value: "Two|Three", start: 4, end: 14 }
  ]);

  assert.equal(isStandalonePunctuationToken("..."), true);
  assert.equal(isStandalonePunctuationToken(""), false);
  assert.equal(isStandalonePunctuationToken("word"), false);
  assert.equal(buildStandalonePunctuationSuffix("--"), " --");
  assert.equal(buildStandalonePunctuationSuffix(","), ",");
  assert.equal(buildStandalonePunctuationSuffix(""), "");

  assert.equal(normalizeValue("  alpha  "), "alpha");
  assert.equal(normalizeValue("   "), undefined);
  assert.equal(isLegacyMetadataKey("xslow_offset"), true);
  assert.equal(isKnownEmotion(undefined), false);
  assert.equal(isKnownEmotion("WARM"), true);
  assert.equal(resolveEmotion(undefined, "focused"), "focused");
  assert.equal(resolvePalette("unknown").accent, TpsSpec.emotionPalettes.neutral.accent);
  assert.equal(resolveBaseWpm({ base_wpm: "160" }), 160);
  assert.equal(resolveBaseWpm({ base_wpm: "10" }), 80);
  assert.equal(resolveBaseWpm({}), 140);
  assert.equal(resolveSpeedMultiplier("slow", resolveSpeedOffsets({})), 0.8);
  assert.equal(tryParseAbsoluteWpm("150WPM"), 150);
  assert.equal(tryParseAbsoluteWpm("WPM"), undefined);
  assert.equal(tryParseAbsoluteWpm("fast"), undefined);
  assert.equal(isTimingToken("1:20-2:40"), true);
  assert.equal(isTimingToken(""), false);
  assert.equal(isTimingToken("soon"), false);
  assert.equal(tryResolvePauseMilliseconds(undefined), undefined);
  assert.equal(tryResolvePauseMilliseconds("125ms"), 125);
  assert.equal(tryResolvePauseMilliseconds("oopsms"), undefined);
  assert.equal(tryResolvePauseMilliseconds("1.5s"), 1500);
  assert.equal(tryResolvePauseMilliseconds("oops"), undefined);
  assert.equal(tryResolvePauseMilliseconds("later"), undefined);
  assert.ok(calculateWordDurationMs("teleprompter", 180) >= 120);
  assert.equal(calculateOrpIndex(""), 0);
  assert.equal(calculateOrpIndex("a"), 0);
  assert.equal(resolveEffectiveWpm(140, 180, undefined), 180);
  assert.equal(resolveEffectiveWpm(140, undefined, 0.8), 112);
  assert.equal(isKnownInlineTag("warm"), true);
  assert.equal(isKnownInlineTag("nonsense"), false);
  assert.equal(isSentenceEndingPunctuation("ready?"), true);
  assert.equal(buildInvalidWpmMessage("10WPM"), "WPM '10WPM' must be between 80 and 220.");
  assert.equal(isInvalidWpm(300), true);
  assert.equal(isValidationErrorCode("invalid-header-parameter"), false);
});

test("covers content compiler edge cases for punctuation, unmatched tags, and blank tokens", () => {
  const diagnostics = [];
  const punctuation = compileContent("hello !", 0, inherited(), createLineStarts("hello !"), diagnostics);
  assert.equal(punctuation.words[0].cleanText, "hello!");
  assert.equal(punctuation.phrases[0].text, "hello!");

  const blank = compileContent("   ", 0, inherited(), [0], []);
  assert.deepEqual(blank.words, []);

  const broken = compileContent("*literal [broken", 0, inherited(), createLineStarts("*literal [broken"), diagnostics);
  assert.ok(broken.words.some((word) => word.cleanText.includes("*literal")));
  assert.ok(diagnostics.some((diagnostic) => diagnostic.code === "unterminated-tag"));

  const missingArgument = compileContent("[phonetic]camel[/phonetic]", 0, inherited(), [0], []);
  assert.ok(missingArgument.words.some((word) => word.cleanText.includes("[phonetic]camel[/phonetic]")));

  const unmatched = compileContent("[/slow] open", 0, inherited(), [0], []);
  assert.equal(unmatched.words.at(-1).cleanText, "open");

  const defaultHeadCue = compileContent("word", 0, { targetWpm: 140, emotion: "", speedOffsets: resolveSpeedOffsets({}) }, [0], []);
  assert.equal(defaultHeadCue.words[0].metadata.headCue, TpsSpec.emotionHeadCues.neutral);
});

test("covers parser edge cases for invalid headers and implicit content routing", () => {
  assert.equal(parseTps("## \n").diagnostics[0].code, "invalid-header");
  assert.equal(parseTps("## []").diagnostics[0].code, "invalid-header");
  assert.equal(parseTps("---\n# comment\nbad-line\nbase_wpm: 150\n---\n## [Name| ]").document.metadata.base_wpm, "150");
  assert.equal(parseTps("## [Name|140]\n### [Empty]\n## [Next]").document.segments[0].blocks[0].content, "");
  assert.equal(parseTps("---\nbase_wpm: fast\n---").diagnostics[0].code, "invalid-front-matter");
  assert.equal(parseTps("---\nbase_wpm: 10\n---").diagnostics[0].code, "invalid-wpm");
  assert.equal(parseTps("---\nspeed_offsets:\n  fast: quick\n---").diagnostics[0].code, "invalid-front-matter");

  const beforeBlock = parseTps("Lead text\n### Body\nCopy.");
  assert.equal(beforeBlock.document.segments[0].name, TpsSpec.defaultImplicitSegmentName);
  assert.equal(beforeBlock.document.segments[0].leadingContent, "Lead text");

  const plainHeader = parseTps("## Plain\n### Inner\nCopy.");
  assert.equal(plainHeader.document.segments[0].name, "Plain");
  assert.equal(plainHeader.document.segments[0].blocks[0].name, "Inner");
});

test("covers player fallback branches on empty scripts and pause-only blocks", () => {
  const emptyScript = compileTps("").script;
  const emptyState = new TpsPlayer(emptyScript).getState(0);
  assert.equal(emptyState.progress, 1);
  assert.equal(emptyState.currentWordIndex, -1);
  assert.equal(emptyState.presentation.visibleWords.length, 0);

  const pauseOnlyScript = compileTps("## [Signal]\n### [Body]\n[pause:1s]").script;
  const pauseState = new TpsPlayer(pauseOnlyScript).getState(100);
  assert.equal(pauseState.currentWord.kind, "pause");
  assert.equal(pauseState.nextTransitionMs, 1000);
});

test("covers compiled-script normalization and playback option guard branches", () => {
  const compiled = compileTps("## [Intro]\n### [Lead]\nReady.\n### [Close]\nNow.").script;
  const frozen = normalizeCompiledScript(compiled);
  assert.equal(Object.isFrozen(frozen), true);
  assert.equal(Object.isFrozen(frozen.words), true);
  assert.equal(Object.isFrozen(frozen.words[0]), true);

  assert.throws(() => parseCompiledScriptJson("[]"), /script object/i);
  assert.throws(() => normalizeCompiledScript({ metadata: [], totalDurationMs: 0, segments: [], words: [] }), /metadata must be an object/i);
  assert.throws(() => normalizeCompiledScript({ metadata: {}, totalDurationMs: 0, segments: {}, words: [] }), /segments array/i);
  assert.throws(() => normalizeCompiledScript({ metadata: {}, totalDurationMs: "0", segments: [], words: [] }), /totalDurationMs must be an integer/i);

  const invalidWord = structuredClone(compiled);
  invalidWord.words[0].index = 99;
  assert.throws(() => normalizeCompiledScript(invalidWord), /sequential indexes/i);

  const invalidCanonicalReference = structuredClone(compiled);
  invalidCanonicalReference.segments[0].words = [
    { ...invalidCanonicalReference.segments[0].words[0], id: "missing-word" },
    ...invalidCanonicalReference.segments[0].words.slice(1)
  ];
  assert.throws(() => normalizeCompiledScript(invalidCanonicalReference), /canonical word/i);

  const defaultedTempoSession = new TpsPlaybackSession(compiled, { baseWpm: Number.NaN, initialSpeedOffsetWpm: Number.NaN });
  assert.equal(defaultedTempoSession.baseWpm, TpsSpec.defaultBaseWpm);
  assert.equal(defaultedTempoSession.speedOffset, 0);
  defaultedTempoSession.dispose();

  assert.throws(() => new TpsPlaybackSession(compiled, { speedStepWpm: 0 }), /speedStepWpm/i);
  assert.throws(() => new TpsPlaybackSession(compiled, { tickIntervalMs: 0 }), /tickIntervalMs/i);

  const seekSession = new TpsPlaybackSession(compiled);
  assert.equal(seekSession.seek(0).elapsedMs, 0);
  assert.equal(seekSession.status, "idle");
  assert.equal(seekSession.seek(compiled.totalDurationMs).isComplete, true);
  assert.equal(seekSession.status, "completed");
  seekSession.dispose();
});
