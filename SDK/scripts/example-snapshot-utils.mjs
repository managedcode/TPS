import { readFileSync } from "node:fs";
import path from "node:path";

export const EXAMPLE_FILES = ["basic.tps", "advanced.tps", "multi-segment.tps"];

export function exampleSnapshotPath(rootDir, fileName) {
  return path.join(rootDir, "SDK", "fixtures", "examples", `${path.basename(fileName, ".tps")}.snapshot.json`);
}

export function loadExampleSnapshot(rootDir, fileName) {
  return JSON.parse(readFileSync(exampleSnapshotPath(rootDir, fileName), "utf8"));
}

export function buildExampleSnapshot(fileName, script, playerFactory) {
  const player = playerFactory(script);
  const elapsedCheckpoints = createCheckpointTimes(script.totalDurationMs);

  return {
    fileName,
    source: `examples/${fileName}`,
    compiled: normalizeCompiledScript(script),
    player: {
      checkpoints: elapsedCheckpoints.map(({ label, elapsedMs }) => normalizePlayerState(label, player.getState(elapsedMs)))
    }
  };
}

function createCheckpointTimes(totalDurationMs) {
  const raw = [
    { label: "start", elapsedMs: 0 },
    { label: "quarter", elapsedMs: Math.round(totalDurationMs * 0.25) },
    { label: "middle", elapsedMs: Math.round(totalDurationMs * 0.5) },
    { label: "threeQuarter", elapsedMs: Math.round(totalDurationMs * 0.75) },
    { label: "complete", elapsedMs: totalDurationMs }
  ];

  const seen = new Set();
  return raw.filter(checkpoint => {
    if (seen.has(checkpoint.elapsedMs)) {
      return false;
    }

    seen.add(checkpoint.elapsedMs);
    return true;
  });
}

function normalizeCompiledScript(script) {
  return compactObject({
    metadata: sortRecord(script.metadata),
    totalDurationMs: script.totalDurationMs,
    segments: script.segments.map(normalizeCompiledSegment),
    words: script.words.map(normalizeCompiledWord)
  });
}

function normalizeCompiledSegment(segment) {
  return compactObject({
    id: segment.id,
    name: segment.name,
    targetWpm: segment.targetWpm,
    emotion: segment.emotion,
    speaker: segment.speaker,
    timing: segment.timing,
    backgroundColor: segment.backgroundColor,
    textColor: segment.textColor,
    accentColor: segment.accentColor,
    startWordIndex: segment.startWordIndex,
    endWordIndex: segment.endWordIndex,
    startMs: segment.startMs,
    endMs: segment.endMs,
    wordIds: segment.words.map(word => word.id),
    blocks: segment.blocks.map(normalizeCompiledBlock)
  });
}

function normalizeCompiledBlock(block) {
  return compactObject({
    id: block.id,
    name: block.name,
    targetWpm: block.targetWpm,
    emotion: block.emotion,
    speaker: block.speaker,
    isImplicit: block.isImplicit,
    startWordIndex: block.startWordIndex,
    endWordIndex: block.endWordIndex,
    startMs: block.startMs,
    endMs: block.endMs,
    wordIds: block.words.map(word => word.id),
    phrases: block.phrases.map(normalizeCompiledPhrase)
  });
}

function normalizeCompiledPhrase(phrase) {
  return compactObject({
    id: phrase.id,
    text: phrase.text,
    startWordIndex: phrase.startWordIndex,
    endWordIndex: phrase.endWordIndex,
    startMs: phrase.startMs,
    endMs: phrase.endMs,
    wordIds: phrase.words.map(word => word.id)
  });
}

function normalizeCompiledWord(word) {
  return compactObject({
    id: word.id,
    index: word.index,
    kind: word.kind,
    cleanText: word.cleanText,
    characterCount: word.characterCount,
    orpPosition: word.orpPosition,
    displayDurationMs: word.displayDurationMs,
    startMs: word.startMs,
    endMs: word.endMs,
    metadata: normalizeWordMetadata(word.metadata),
    segmentId: word.segmentId,
    blockId: word.blockId,
    phraseId: word.phraseId
  });
}

function normalizeWordMetadata(metadata) {
  return compactObject({
    isEmphasis: metadata.isEmphasis,
    emphasisLevel: metadata.emphasisLevel,
    isPause: metadata.isPause,
    pauseDurationMs: metadata.pauseDurationMs,
    isHighlight: metadata.isHighlight,
    isBreath: metadata.isBreath,
    isEditPoint: metadata.isEditPoint,
    editPointPriority: metadata.editPointPriority,
    emotionHint: metadata.emotionHint,
    inlineEmotionHint: metadata.inlineEmotionHint,
    volumeLevel: metadata.volumeLevel,
    deliveryMode: metadata.deliveryMode,
    phoneticGuide: metadata.phoneticGuide,
    pronunciationGuide: metadata.pronunciationGuide,
    stressText: metadata.stressText,
    stressGuide: metadata.stressGuide,
    speedOverride: metadata.speedOverride,
    speedMultiplier: normalizeNumber(metadata.speedMultiplier),
    speaker: metadata.speaker,
    headCue: metadata.headCue
  });
}

function normalizePlayerState(label, state) {
  return compactObject({
    label,
    elapsedMs: state.elapsedMs,
    remainingMs: state.remainingMs,
    progress: normalizeNumber(state.progress),
    isComplete: state.isComplete,
    currentWordIndex: state.currentWordIndex,
    currentWordId: state.currentWord?.id,
    currentWordText: state.currentWord?.cleanText,
    currentWordKind: state.currentWord?.kind,
    previousWordId: state.previousWord?.id,
    nextWordId: state.nextWord?.id,
    currentSegmentId: state.currentSegment?.id,
    currentBlockId: state.currentBlock?.id,
    currentPhraseId: state.currentPhrase?.id,
    nextTransitionMs: state.nextTransitionMs,
    presentation: compactObject({
      segmentName: state.presentation.segmentName,
      blockName: state.presentation.blockName,
      phraseText: state.presentation.phraseText,
      visibleWordIds: state.presentation.visibleWords.map(word => word.id),
      visibleWordTexts: state.presentation.visibleWords.map(word => word.cleanText),
      activeWordInPhrase: state.presentation.activeWordInPhrase
    })
  });
}

function normalizeNumber(value) {
  return typeof value === "number" ? Number(value.toFixed(6)) : undefined;
}

function sortRecord(record) {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}

function compactObject(value) {
  if (Array.isArray(value)) {
    return value.map(compactObject);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined && entry !== null)
        .map(([key, entry]) => [key, compactObject(entry)])
    );
  }

  return value;
}
