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
  isKnownArchetype,
  isKnownEmotion,
  isKnownInlineTag,
  isLegacyMetadataKey,
  isSentenceEndingPunctuation,
  isTimingToken,
  isValidationErrorCode,
  normalizeValue,
  resolveArchetypeWpm,
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
  assert.equal(isKnownInlineTag("legato"), true);
  assert.equal(isKnownInlineTag("staccato"), true);
  assert.equal(isKnownInlineTag("energy"), true);
  assert.equal(isKnownInlineTag("melody"), true);
  assert.equal(isKnownArchetype("coach"), true);
  assert.equal(isKnownArchetype("Friend"), true);
  assert.equal(isKnownArchetype("nonsense"), false);
  assert.equal(isKnownArchetype(undefined), false);
  assert.equal(resolveArchetypeWpm("educator"), 120);
  assert.equal(resolveArchetypeWpm("motivator"), 155);
  assert.equal(resolveArchetypeWpm("nonsense"), undefined);
  assert.equal(resolveArchetypeWpm(undefined), undefined);
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

test("covers articulation inline tags", () => {
  const legato = compileContent("[legato]smooth flow[/legato]", 0, inherited(), [0], []);
  assert.equal(legato.words[0].metadata.articulationStyle, "legato");
  assert.equal(legato.words[1].metadata.articulationStyle, "legato");

  const staccato = compileContent("[staccato]sharp words[/staccato]", 0, inherited(), [0], []);
  assert.equal(staccato.words[0].metadata.articulationStyle, "staccato");
  assert.equal(staccato.words[1].metadata.articulationStyle, "staccato");

  const noArticulation = compileContent("plain word", 0, inherited(), [0], []);
  assert.equal(noArticulation.words[0].metadata.articulationStyle, undefined);

  // staccato overrides legato when nested (innermost wins)
  const nestedArticulation = compileContent("[legato][staccato]inner[/staccato] outer[/legato]", 0, inherited(), [0], []);
  assert.equal(nestedArticulation.words[0].metadata.articulationStyle, "staccato");
  assert.equal(nestedArticulation.words[1].metadata.articulationStyle, "legato");

  // articulation stacks with other tags independently
  const withVolume = compileContent("[staccato][loud]command[/loud][/staccato]", 0, inherited(), [0], []);
  assert.equal(withVolume.words[0].metadata.articulationStyle, "staccato");
  assert.equal(withVolume.words[0].metadata.volumeLevel, "loud");

  const withSpeed = compileContent("[legato][fast]flowing fast[/fast][/legato]", 0, inherited(), [0], []);
  assert.equal(withSpeed.words[0].metadata.articulationStyle, "legato");
  assert.ok(withSpeed.words[0].metadata.speedMultiplier > 1);

  const withEmphasis = compileContent("[staccato]**bold**[/staccato]", 0, inherited(), [0], []);
  assert.equal(withEmphasis.words[0].metadata.articulationStyle, "staccato");
  assert.equal(withEmphasis.words[0].metadata.emphasisLevel, 2);

  // case insensitive
  const uppercase = compileContent("[LEGATO]word[/LEGATO]", 0, inherited(), [0], []);
  assert.equal(uppercase.words[0].metadata.articulationStyle, "legato");

  // unclosed articulation produces diagnostic
  const unclosed = [];
  compileContent("[legato]never closed", 0, inherited(), [0], unclosed);
  assert.ok(unclosed.some((d) => d.code === "unclosed-tag"));
});

test("covers energy inline tag with boundary values and errors", () => {
  // valid range 1-10
  const energy1 = compileContent("[energy:1]minimum[/energy]", 0, inherited(), [0], []);
  assert.equal(energy1.words[0].metadata.energyLevel, 1);

  const energy10 = compileContent("[energy:10]maximum[/energy]", 0, inherited(), [0], []);
  assert.equal(energy10.words[0].metadata.energyLevel, 10);

  const energy5 = compileContent("[energy:5]middle[/energy]", 0, inherited(), [0], []);
  assert.equal(energy5.words[0].metadata.energyLevel, 5);

  // multiple words in scope
  const multi = compileContent("[energy:7]three word phrase[/energy]", 0, inherited(), [0], []);
  assert.equal(multi.words[0].metadata.energyLevel, 7);
  assert.equal(multi.words[1].metadata.energyLevel, 7);
  assert.equal(multi.words[2].metadata.energyLevel, 7);

  // nested: innermost wins
  const nested = compileContent("[energy:5][energy:9]inner[/energy] outer[/energy]", 0, inherited(), [0], []);
  assert.equal(nested.words[0].metadata.energyLevel, 9);
  assert.equal(nested.words[1].metadata.energyLevel, 5);

  // no energy tag = undefined
  const plain = compileContent("plain", 0, inherited(), [0], []);
  assert.equal(plain.words[0].metadata.energyLevel, undefined);

  // invalid: too high
  const tooHigh = [];
  compileContent("[energy:11]bad[/energy]", 0, inherited(), [0], tooHigh);
  assert.ok(tooHigh.some((d) => d.code === "invalid-energy-level"));

  const tooHigh15 = [];
  compileContent("[energy:15]bad[/energy]", 0, inherited(), [0], tooHigh15);
  assert.ok(tooHigh15.some((d) => d.code === "invalid-energy-level"));

  // invalid: too low
  const tooLow = [];
  compileContent("[energy:0]bad[/energy]", 0, inherited(), [0], tooLow);
  assert.ok(tooLow.some((d) => d.code === "invalid-energy-level"));

  const negative = [];
  compileContent("[energy:-1]bad[/energy]", 0, inherited(), [0], negative);
  assert.ok(negative.some((d) => d.code === "invalid-energy-level"));

  // invalid: non-integer
  const nonInt = [];
  compileContent("[energy:abc]bad[/energy]", 0, inherited(), [0], nonInt);
  assert.ok(nonInt.some((d) => d.code === "invalid-energy-level"));

  // 5.5 is parsed as 5 by parseInt — valid (truncated to integer)
  const decimal = compileContent("[energy:5.5]word[/energy]", 0, inherited(), [0], []);
  assert.equal(decimal.words[0].metadata.energyLevel, 5);

  // invalid: missing argument
  const missing = [];
  compileContent("[energy]bad[/energy]", 0, inherited(), [0], missing);
  assert.ok(missing.some((d) => d.code === "invalid-energy-level"));

  // energy stacks with articulation
  const combined = compileContent("[staccato][energy:8]command[/energy][/staccato]", 0, inherited(), [0], []);
  assert.equal(combined.words[0].metadata.articulationStyle, "staccato");
  assert.equal(combined.words[0].metadata.energyLevel, 8);
});

test("covers melody inline tag with boundary values and errors", () => {
  const melody1 = compileContent("[melody:1]flat[/melody]", 0, inherited(), [0], []);
  assert.equal(melody1.words[0].metadata.melodyLevel, 1);

  const melody10 = compileContent("[melody:10]dramatic[/melody]", 0, inherited(), [0], []);
  assert.equal(melody10.words[0].metadata.melodyLevel, 10);

  const melody3 = compileContent("[melody:3]moderate[/melody]", 0, inherited(), [0], []);
  assert.equal(melody3.words[0].metadata.melodyLevel, 3);

  // nested: innermost wins
  const nested = compileContent("[melody:2][melody:8]inner[/melody] outer[/melody]", 0, inherited(), [0], []);
  assert.equal(nested.words[0].metadata.melodyLevel, 8);
  assert.equal(nested.words[1].metadata.melodyLevel, 2);

  const plain = compileContent("plain", 0, inherited(), [0], []);
  assert.equal(plain.words[0].metadata.melodyLevel, undefined);

  // invalid: out of range
  const tooHigh = [];
  compileContent("[melody:11]bad[/melody]", 0, inherited(), [0], tooHigh);
  assert.ok(tooHigh.some((d) => d.code === "invalid-melody-level"));

  const tooLow = [];
  compileContent("[melody:0]bad[/melody]", 0, inherited(), [0], tooLow);
  assert.ok(tooLow.some((d) => d.code === "invalid-melody-level"));

  const nonInt = [];
  compileContent("[melody:abc]bad[/melody]", 0, inherited(), [0], nonInt);
  assert.ok(nonInt.some((d) => d.code === "invalid-melody-level"));

  const missing = [];
  compileContent("[melody]bad[/melody]", 0, inherited(), [0], missing);
  assert.ok(missing.some((d) => d.code === "invalid-melody-level"));

  // all three new tags combined
  const allThree = compileContent("[legato][energy:8][melody:7]expressive[/melody][/energy][/legato]", 0, inherited(), [0], []);
  assert.equal(allThree.words[0].metadata.articulationStyle, "legato");
  assert.equal(allThree.words[0].metadata.energyLevel, 8);
  assert.equal(allThree.words[0].metadata.melodyLevel, 7);
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

test("covers archetype header parameter parsing and validation", () => {
  // basic segment archetype
  const withArchetype = compileTps("## [Intro|Warm|Archetype:Coach]\n### [Body]\nGo.");
  assert.equal(withArchetype.ok, true);
  assert.equal(withArchetype.script.segments[0].archetype, "coach");

  // block-level archetype (segment has none)
  const blockArchetype = compileTps("## [Intro|Warm]\n### [Body|Archetype:Friend]\nHi.");
  assert.equal(blockArchetype.ok, true);
  assert.equal(blockArchetype.script.segments[0].archetype, undefined);
  assert.equal(blockArchetype.script.segments[0].blocks[0].archetype, "friend");

  // block inherits segment archetype
  const inheritedArch = compileTps("## [Intro|Archetype:Motivator]\n### [Body]\nGo.");
  assert.equal(inheritedArch.script.segments[0].blocks[0].archetype, "motivator");

  // block overrides segment archetype
  const overrideArch = compileTps("## [Intro|Archetype:Motivator]\n### [Body|Archetype:Coach]\nGo.");
  assert.equal(overrideArch.script.segments[0].archetype, "motivator");
  assert.equal(overrideArch.script.segments[0].blocks[0].archetype, "coach");

  // archetype sets recommended WPM when no explicit WPM
  const archetypeWpm = compileTps("## [Intro|Archetype:Educator]\n### [Body]\nLearn.");
  assert.equal(archetypeWpm.script.segments[0].targetWpm, 120);

  // all six archetypes resolve correct recommended WPM
  assert.equal(compileTps("## [S|Archetype:Friend]\n### [B]\nW.").script.segments[0].targetWpm, 135);
  assert.equal(compileTps("## [S|Archetype:Motivator]\n### [B]\nW.").script.segments[0].targetWpm, 155);
  assert.equal(compileTps("## [S|Archetype:Educator]\n### [B]\nW.").script.segments[0].targetWpm, 120);
  assert.equal(compileTps("## [S|Archetype:Coach]\n### [B]\nW.").script.segments[0].targetWpm, 145);
  assert.equal(compileTps("## [S|Archetype:Storyteller]\n### [B]\nW.").script.segments[0].targetWpm, 125);
  assert.equal(compileTps("## [S|Archetype:Entertainer]\n### [B]\nW.").script.segments[0].targetWpm, 150);

  // explicit WPM overrides archetype recommended WPM
  const explicitWpmOverride = compileTps("## [Intro|150WPM|Archetype:Educator]\n### [Body]\nLearn.");
  assert.equal(explicitWpmOverride.script.segments[0].targetWpm, 150);

  // block with archetype but no WPM uses archetype WPM
  const blockWpm = compileTps("## [Intro]\n### [Body|Archetype:Coach]\nGo.");
  assert.equal(blockWpm.script.segments[0].blocks[0].targetWpm, 145);

  // block explicit WPM overrides archetype WPM
  const blockExplicit = compileTps("## [Intro]\n### [Body|130WPM|Archetype:Coach]\nGo.");
  assert.equal(blockExplicit.script.segments[0].blocks[0].targetWpm, 130);

  // archetype is case-insensitive
  const caseInsensitive = compileTps("## [Intro|Archetype:COACH]\n### [Body]\nGo.");
  assert.equal(caseInsensitive.script.segments[0].archetype, "coach");

  const mixedCase = compileTps("## [Intro|Archetype:eDuCaToR]\n### [Body]\nGo.");
  assert.equal(mixedCase.script.segments[0].archetype, "educator");

  // unknown archetype produces diagnostic
  const unknownArchetype = parseTps("## [Intro|Archetype:Unknown]\n### [Body]\nHi.");
  assert.ok(unknownArchetype.diagnostics.some((d) => d.code === "unknown-archetype"));

  // empty archetype value produces diagnostic
  const emptyArchetype = parseTps("## [Intro|Archetype:]\n### [Body]\nHi.");
  assert.ok(emptyArchetype.diagnostics.some((d) => d.code === "unknown-archetype"));

  // archetype with other parameters in any order
  const anyOrder = compileTps("## [Intro|Archetype:Friend|Warm|Speaker:Alex]\n### [Body]\nHi.");
  assert.equal(anyOrder.script.segments[0].archetype, "friend");
  assert.equal(anyOrder.script.segments[0].emotion, "warm");
  assert.equal(anyOrder.script.segments[0].speaker, "Alex");

  // no archetype = undefined
  const noArchetype = compileTps("## [Intro|Warm]\n### [Body]\nHi.");
  assert.equal(noArchetype.script.segments[0].archetype, undefined);

  // segment without archetype uses base_wpm not archetype WPM
  const noArchWpm = compileTps("---\nbase_wpm: 160\n---\n## [Intro]\n### [Body]\nWord.");
  assert.equal(noArchWpm.script.segments[0].targetWpm, 160);

  // archetype propagates through implicit blocks (leading content)
  const implicit = compileTps("## [Intro|Archetype:Coach]\nLead text.\n### [Body]\nBlock text.");
  assert.equal(implicit.script.segments[0].blocks[0].archetype, "coach");
  assert.equal(implicit.script.segments[0].blocks[0].isImplicit, true);
  assert.equal(implicit.script.segments[0].blocks[1].archetype, "coach");

  // full end-to-end: archetype + new tags in compiled output
  const e2e = compileTps("## [Rally|Motivational|Archetype:Motivator]\n### [Body]\n[legato][energy:9][melody:8]Rise up.[/melody][/energy][/legato]");
  assert.equal(e2e.ok, true);
  assert.equal(e2e.script.segments[0].archetype, "motivator");
  assert.equal(e2e.script.segments[0].targetWpm, 155);
  const riseWord = e2e.script.words.find((w) => w.cleanText === "Rise");
  assert.equal(riseWord.metadata.articulationStyle, "legato");
  assert.equal(riseWord.metadata.energyLevel, 9);
  assert.equal(riseWord.metadata.melodyLevel, 8);
});

test("covers spec constants for new archetype and articulation features", () => {
  // archetype names exist as constants
  assert.ok(TpsSpec.archetypes.includes("friend"));
  assert.ok(TpsSpec.archetypes.includes("motivator"));
  assert.ok(TpsSpec.archetypes.includes("educator"));
  assert.ok(TpsSpec.archetypes.includes("coach"));
  assert.ok(TpsSpec.archetypes.includes("storyteller"));
  assert.ok(TpsSpec.archetypes.includes("entertainer"));
  assert.equal(TpsSpec.archetypes.length, 6);

  // articulation styles
  assert.ok(TpsSpec.articulationStyles.includes("legato"));
  assert.ok(TpsSpec.articulationStyles.includes("staccato"));
  assert.equal(TpsSpec.articulationStyles.length, 2);

  // energy/melody bounds
  assert.equal(TpsSpec.energyLevels.min, 1);
  assert.equal(TpsSpec.energyLevels.max, 10);
  assert.equal(TpsSpec.melodyLevels.min, 1);
  assert.equal(TpsSpec.melodyLevels.max, 10);

  // archetype recommended WPM map
  assert.equal(TpsSpec.archetypeRecommendedWpm.friend, 135);
  assert.equal(TpsSpec.archetypeRecommendedWpm.motivator, 155);
  assert.equal(TpsSpec.archetypeRecommendedWpm.educator, 120);
  assert.equal(TpsSpec.archetypeRecommendedWpm.coach, 145);
  assert.equal(TpsSpec.archetypeRecommendedWpm.storyteller, 125);
  assert.equal(TpsSpec.archetypeRecommendedWpm.entertainer, 150);

  // new tags in tag list
  assert.equal(TpsSpec.tags.legato, "legato");
  assert.equal(TpsSpec.tags.staccato, "staccato");
  assert.equal(TpsSpec.tags.energy, "energy");
  assert.equal(TpsSpec.tags.melody, "melody");

  // archetype prefix
  assert.equal(TpsSpec.headerTokens.archetypePrefix, "Archetype:");

  // diagnostic codes
  assert.equal(TpsSpec.diagnosticCodes.invalidEnergyLevel, "invalid-energy-level");
  assert.equal(TpsSpec.diagnosticCodes.invalidMelodyLevel, "invalid-melody-level");
  assert.equal(TpsSpec.diagnosticCodes.unknownArchetype, "unknown-archetype");
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

  assert.throws(() => parseCompiledScriptJson(""), /non-empty string/i);
  assert.throws(() => parseCompiledScriptJson(" "), /non-empty string/i);
  assert.throws(() => parseCompiledScriptJson("[]"), /script object/i);
  assert.throws(() => normalizeCompiledScript({ metadata: [], totalDurationMs: 0, segments: [], words: [] }), /metadata must be an object/i);
  assert.throws(() => normalizeCompiledScript({ metadata: {}, totalDurationMs: 0, segments: {}, words: [] }), /segments array/i);
  assert.throws(() => normalizeCompiledScript({ metadata: {}, totalDurationMs: "0", segments: [], words: [] }), /totalDurationMs must be an integer/i);

  const invalidWord = structuredClone(compiled);
  invalidWord.words[0].index = 99;
  assert.throws(() => normalizeCompiledScript(invalidWord), /sequential indexes/i);

  const duplicateSegmentIdentifier = structuredClone(compiled);
  duplicateSegmentIdentifier.segments = [
    duplicateSegmentIdentifier.segments[0],
    { ...duplicateSegmentIdentifier.segments[0], blocks: [], words: [] }
  ];
  assert.throws(() => normalizeCompiledScript(duplicateSegmentIdentifier), /segment identifiers must be unique/i);

  const emptyWordIdentifier = structuredClone(compiled);
  emptyWordIdentifier.words[0].id = " ";
  assert.throws(() => normalizeCompiledScript(emptyWordIdentifier), /word identifiers cannot be empty/i);

  const invalidCanonicalReference = structuredClone(compiled);
  invalidCanonicalReference.segments[0].words = [
    { ...invalidCanonicalReference.segments[0].words[0], id: "missing-word" },
    ...invalidCanonicalReference.segments[0].words.slice(1)
  ];
  assert.throws(() => normalizeCompiledScript(invalidCanonicalReference), /canonical word/i);

  const invalidSegmentReference = structuredClone(compiled);
  invalidSegmentReference.words[0].segmentId = "missing-segment";
  assert.throws(() => normalizeCompiledScript(invalidSegmentReference), /must reference segment/i);

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
