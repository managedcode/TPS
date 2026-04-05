import {
  TpsArchetypeArticulationExpectations,
  TpsArchetypeProfiles,
  TpsArchetypeRhythmProfiles,
  TpsArchetypeVolumeExpectations,
  TpsDiagnosticCodes,
  TpsSpec
} from "./constants.js";
import { createWarningDiagnostic } from "./diagnostics.js";
import type { CompiledBlock, CompiledWord, TpsDiagnostic } from "./models.js";

export interface ArchetypeDiagnosticTarget {
  block: CompiledBlock;
  rangeStart: number;
  rangeEnd: number;
}

interface MetricRange {
  min: number;
  max: number;
}

interface RhythmProfile {
  phraseLength: MetricRange;
  pauseFrequencyPer100Words: MetricRange;
  averagePauseDurationMs: MetricRange;
  emphasisDensityPercent: MetricRange;
  speedVariationPer100Words: MetricRange;
}

interface ArchetypeScopeMetrics {
  averagePhraseLength: number;
  pauseFrequencyPer100Words: number;
  averagePauseDurationMs: number | undefined;
  emphasisDensityPercent: number;
  speedVariationPer100Words: number;
}

const archetypeProfiles = TpsArchetypeProfiles as Record<
  string,
  {
    articulation: string;
    energy: MetricRange;
    melody: MetricRange;
    volume: string;
    speed: MetricRange;
  }
>;

const archetypeRhythmProfiles = TpsArchetypeRhythmProfiles as unknown as { minimumWords: number } & Record<string, RhythmProfile>;

export function appendArchetypeDiagnostics(
  targets: readonly ArchetypeDiagnosticTarget[],
  lineStarts: readonly number[],
  diagnostics: TpsDiagnostic[]
): void {
  for (const target of targets) {
    const archetype = target.block.archetype?.toLowerCase();
    if (!archetype) {
      continue;
    }

    const profile = archetypeProfiles[archetype];
    const rhythm = archetypeRhythmProfiles[archetype];
    if (!profile || !rhythm) {
      continue;
    }

    const spokenWords = target.block.words.filter(isSpokenWord);
    if (spokenWords.length === 0) {
      continue;
    }

    appendProfileWarnings(target, archetype, profile, spokenWords, lineStarts, diagnostics);
    appendRhythmWarnings(target, archetype, rhythm, spokenWords, lineStarts, diagnostics);
  }
}

function appendProfileWarnings(
  target: ArchetypeDiagnosticTarget,
  archetype: string,
  profile: {
    articulation: string;
    energy: MetricRange;
    melody: MetricRange;
    volume: string;
    speed: MetricRange;
  },
  spokenWords: readonly CompiledWord[],
  lineStarts: readonly number[],
  diagnostics: TpsDiagnostic[]
): void {
  const articulationConflict = spokenWords.find((word) => isArticulationMismatch(word.metadata.articulationStyle, profile.articulation));
  if (articulationConflict) {
    diagnostics.push(
      createWarningDiagnostic(
        TpsDiagnosticCodes.archetypeArticulationMismatch,
        buildArticulationMessage(archetype, target.block.name, articulationConflict.metadata.articulationStyle ?? "unknown", profile.articulation),
        target.rangeStart,
        target.rangeEnd,
        lineStarts,
        buildArticulationSuggestion(profile.articulation)
      )
    );
  }

  const energyConflict = spokenWords.find((word) => isOutOfRange(word.metadata.energyLevel, profile.energy));
  if (energyConflict && typeof energyConflict.metadata.energyLevel === "number") {
    diagnostics.push(
      createWarningDiagnostic(
        TpsDiagnosticCodes.archetypeEnergyMismatch,
        `Archetype '${archetype}' expects energy between ${profile.energy.min} and ${profile.energy.max}, but block '${target.block.name}' uses ${energyConflict.metadata.energyLevel} on '${energyConflict.cleanText}'.`,
        target.rangeStart,
        target.rangeEnd,
        lineStarts,
        `Keep [energy:N] between ${profile.energy.min} and ${profile.energy.max} for this archetype.`
      )
    );
  }

  const melodyConflict = spokenWords.find((word) => isOutOfRange(word.metadata.melodyLevel, profile.melody));
  if (melodyConflict && typeof melodyConflict.metadata.melodyLevel === "number") {
    diagnostics.push(
      createWarningDiagnostic(
        TpsDiagnosticCodes.archetypeMelodyMismatch,
        `Archetype '${archetype}' expects melody between ${profile.melody.min} and ${profile.melody.max}, but block '${target.block.name}' uses ${melodyConflict.metadata.melodyLevel} on '${melodyConflict.cleanText}'.`,
        target.rangeStart,
        target.rangeEnd,
        lineStarts,
        `Keep [melody:N] between ${profile.melody.min} and ${profile.melody.max} for this archetype.`
      )
    );
  }

  const volumeConflict = spokenWords.find((word) => isVolumeMismatch(word.metadata.volumeLevel, profile.volume));
  if (volumeConflict) {
    diagnostics.push(
      createWarningDiagnostic(
        TpsDiagnosticCodes.archetypeVolumeMismatch,
        buildVolumeMessage(archetype, target.block.name, volumeConflict.metadata.volumeLevel ?? "default", profile.volume),
        target.rangeStart,
        target.rangeEnd,
        lineStarts,
        buildVolumeSuggestion(profile.volume)
      )
    );
  }

  const speedConflict = spokenWords.find((word) => isSpeedMismatch(word, target.block.targetWpm, profile.speed));
  if (speedConflict) {
    const effectiveWpm = resolveEffectiveWordWpm(speedConflict, target.block.targetWpm);
    diagnostics.push(
      createWarningDiagnostic(
        TpsDiagnosticCodes.archetypeSpeedMismatch,
        `Archetype '${archetype}' expects inline speed changes to stay between ${profile.speed.min} and ${profile.speed.max} WPM, but block '${target.block.name}' reaches ${effectiveWpm} WPM on '${speedConflict.cleanText}'.`,
        target.rangeStart,
        target.rangeEnd,
        lineStarts,
        `Prefer inline speed tags that keep this scope between ${profile.speed.min} and ${profile.speed.max} WPM.`
      )
    );
  }
}

function appendRhythmWarnings(
  target: ArchetypeDiagnosticTarget,
  archetype: string,
  rhythm: RhythmProfile,
  spokenWords: readonly CompiledWord[],
  lineStarts: readonly number[],
  diagnostics: TpsDiagnostic[]
): void {
  if (spokenWords.length < archetypeRhythmProfiles.minimumWords) {
    return;
  }

  const phraseWordCounts = target.block.phrases.map((phrase) => phrase.words.filter(isSpokenWord).length).filter((count) => count > 0);
  if (phraseWordCounts.length < 2) {
    return;
  }

  const metrics = collectScopeMetrics(target.block, spokenWords, phraseWordCounts);

  pushRhythmWarning(
    diagnostics,
    TpsDiagnosticCodes.archetypeRhythmPhraseLength,
    target,
    lineStarts,
    !isWithinRange(metrics.averagePhraseLength, rhythm.phraseLength),
    `Archetype '${archetype}' expects average phrase length between ${rhythm.phraseLength.min} and ${rhythm.phraseLength.max} words, but block '${target.block.name}' averages ${formatMetric(metrics.averagePhraseLength)}.`,
    `Break phrases so this scope averages between ${rhythm.phraseLength.min} and ${rhythm.phraseLength.max} words.`
  );

  pushRhythmWarning(
    diagnostics,
    TpsDiagnosticCodes.archetypeRhythmPauseFrequency,
    target,
    lineStarts,
    !isWithinRange(metrics.pauseFrequencyPer100Words, rhythm.pauseFrequencyPer100Words),
    `Archetype '${archetype}' expects ${rhythm.pauseFrequencyPer100Words.min} to ${rhythm.pauseFrequencyPer100Words.max} pauses per 100 words, but block '${target.block.name}' has ${formatMetric(metrics.pauseFrequencyPer100Words)}.`,
    `Adjust pause markers so this scope lands between ${rhythm.pauseFrequencyPer100Words.min} and ${rhythm.pauseFrequencyPer100Words.max} pauses per 100 words.`
  );

  pushRhythmWarning(
    diagnostics,
    TpsDiagnosticCodes.archetypeRhythmPauseDuration,
    target,
    lineStarts,
    typeof metrics.averagePauseDurationMs === "number" && !isWithinRange(metrics.averagePauseDurationMs, rhythm.averagePauseDurationMs),
    `Archetype '${archetype}' expects average pause duration between ${rhythm.averagePauseDurationMs.min} and ${rhythm.averagePauseDurationMs.max} ms, but block '${target.block.name}' averages ${formatMetric(metrics.averagePauseDurationMs)} ms.`,
    `Adjust explicit pauses so this scope averages between ${rhythm.averagePauseDurationMs.min} and ${rhythm.averagePauseDurationMs.max} ms.`
  );

  pushRhythmWarning(
    diagnostics,
    TpsDiagnosticCodes.archetypeRhythmEmphasisDensity,
    target,
    lineStarts,
    !isWithinRange(metrics.emphasisDensityPercent, rhythm.emphasisDensityPercent),
    `Archetype '${archetype}' expects emphasis density between ${rhythm.emphasisDensityPercent.min}% and ${rhythm.emphasisDensityPercent.max}%, but block '${target.block.name}' is ${formatMetric(metrics.emphasisDensityPercent)}%.`,
    `Add or remove emphasis so this scope lands between ${rhythm.emphasisDensityPercent.min}% and ${rhythm.emphasisDensityPercent.max}%.`
  );

  pushRhythmWarning(
    diagnostics,
    TpsDiagnosticCodes.archetypeRhythmSpeedVariation,
    target,
    lineStarts,
    !isWithinRange(metrics.speedVariationPer100Words, rhythm.speedVariationPer100Words),
    `Archetype '${archetype}' expects ${rhythm.speedVariationPer100Words.min} to ${rhythm.speedVariationPer100Words.max} inline speed changes per 100 words, but block '${target.block.name}' has ${formatMetric(metrics.speedVariationPer100Words)}.`,
    `Adjust inline speed tags so this scope lands between ${rhythm.speedVariationPer100Words.min} and ${rhythm.speedVariationPer100Words.max} changes per 100 words.`
  );
}

function collectScopeMetrics(
  block: CompiledBlock,
  spokenWords: readonly CompiledWord[],
  phraseWordCounts: readonly number[]
): ArchetypeScopeMetrics {
  const pauses = block.words.filter((word) => word.kind === "pause");
  const pauseFrequencyPer100Words = (pauses.length / spokenWords.length) * 100;
  const averagePauseDurationMs = pauses.length > 0
    ? pauses.reduce((total, word) => total + word.displayDurationMs, 0) / pauses.length
    : undefined;
  const emphasisDensityPercent = (spokenWords.filter((word) => word.metadata.isEmphasis).length / spokenWords.length) * 100;
  const averagePhraseLength = phraseWordCounts.reduce((total, count) => total + count, 0) / phraseWordCounts.length;

  let speedVariationRuns = 0;
  let inVariation = false;
  for (const word of spokenWords) {
    const varied = hasInlineSpeedVariation(word, block.targetWpm);
    if (varied && !inVariation) {
      speedVariationRuns += 1;
    }

    inVariation = varied;
  }

  return {
    averagePhraseLength,
    pauseFrequencyPer100Words,
    averagePauseDurationMs,
    emphasisDensityPercent,
    speedVariationPer100Words: (speedVariationRuns / spokenWords.length) * 100
  };
}

function pushRhythmWarning(
  diagnostics: TpsDiagnostic[],
  code: string,
  target: ArchetypeDiagnosticTarget,
  lineStarts: readonly number[],
  condition: boolean,
  message: string,
  suggestion: string
): void {
  if (!condition) {
    return;
  }

  diagnostics.push(createWarningDiagnostic(code, message, target.rangeStart, target.rangeEnd, lineStarts, suggestion));
}

function isSpokenWord(word: CompiledWord): boolean {
  return word.kind === "word" && Boolean(word.cleanText);
}

function isOutOfRange(value: number | undefined, range: MetricRange): boolean {
  return typeof value === "number" && (value < range.min || value > range.max);
}

function isWithinRange(value: number, range: MetricRange): boolean {
  return value >= range.min && value <= range.max;
}

function isArticulationMismatch(value: string | undefined, expectation: string): boolean {
  if (!value || expectation === TpsArchetypeArticulationExpectations.flexible) {
    return false;
  }

  if (expectation === TpsArchetypeArticulationExpectations.neutral) {
    return true;
  }

  return value !== expectation;
}

function isVolumeMismatch(value: string | undefined, expectation: string): boolean {
  if (expectation === TpsArchetypeVolumeExpectations.flexible || !value) {
    return false;
  }

  if (expectation === TpsArchetypeVolumeExpectations.loudOnly) {
    return value !== TpsSpec.tags.loud;
  }

  if (expectation === TpsArchetypeVolumeExpectations.defaultOnly) {
    return true;
  }

  return value !== TpsSpec.tags.soft;
}

function hasInlineSpeedVariation(word: CompiledWord, inheritedWpm: number): boolean {
  return resolveEffectiveWordWpm(word, inheritedWpm) !== inheritedWpm;
}

function isSpeedMismatch(word: CompiledWord, inheritedWpm: number, range: MetricRange): boolean {
  if (typeof word.metadata.speedOverride !== "number" && typeof word.metadata.speedMultiplier !== "number") {
    return false;
  }

  const effectiveWpm = resolveEffectiveWordWpm(word, inheritedWpm);
  return effectiveWpm < range.min || effectiveWpm > range.max;
}

function resolveEffectiveWordWpm(word: CompiledWord, inheritedWpm: number): number {
  if (typeof word.metadata.speedOverride === "number") {
    return word.metadata.speedOverride;
  }

  if (typeof word.metadata.speedMultiplier === "number") {
    return Math.max(1, Math.round(inheritedWpm * word.metadata.speedMultiplier));
  }

  return inheritedWpm;
}

function buildArticulationMessage(archetype: string, blockName: string, actual: string, expectation: string): string {
  if (expectation === TpsArchetypeArticulationExpectations.neutral) {
    return `Archetype '${archetype}' expects natural diction without articulation tags, but block '${blockName}' uses '${actual}'.`;
  }

  return `Archetype '${archetype}' expects '${expectation}' articulation, but block '${blockName}' uses '${actual}'.`;
}

function buildArticulationSuggestion(expectation: string): string {
  if (expectation === TpsArchetypeArticulationExpectations.neutral) {
    return "Remove [legato] or [staccato] tags from this archetype scope.";
  }

  return `Prefer [${expectation}]...[/${expectation}] when you want to reinforce this archetype.`;
}

function buildVolumeMessage(archetype: string, blockName: string, actual: string, expectation: string): string {
  if (expectation === TpsArchetypeVolumeExpectations.defaultOnly) {
    return `Archetype '${archetype}' expects default volume, but block '${blockName}' uses '${actual}'.`;
  }

  if (expectation === TpsArchetypeVolumeExpectations.softOrDefault) {
    return `Archetype '${archetype}' expects soft or default volume, but block '${blockName}' uses '${actual}'.`;
  }

  return `Archetype '${archetype}' expects loud volume, but block '${blockName}' uses '${actual}'.`;
}

function buildVolumeSuggestion(expectation: string): string {
  if (expectation === TpsArchetypeVolumeExpectations.defaultOnly) {
    return "Remove explicit volume tags from this archetype scope.";
  }

  if (expectation === TpsArchetypeVolumeExpectations.softOrDefault) {
    return "Use [soft] sparingly or leave volume untagged in this scope.";
  }

  return "Prefer [loud] when this archetype needs an explicit volume tag.";
}

function formatMetric(value: number | undefined): string {
  return typeof value === "number" ? value.toFixed(1).replace(/\.0$/u, "") : "0";
}
