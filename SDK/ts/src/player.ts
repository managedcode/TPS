import type { CompiledPhrase, CompiledScript, CompiledWord, PlayerState } from "./models.js";

export class TpsPlayer {
  public constructor(private readonly script: CompiledScript) {}

  public getState(elapsedMs: number): PlayerState {
    const clampedElapsed = clamp(elapsedMs, 0, this.script.totalDurationMs);
    const currentWord = this.findCurrentWord(clampedElapsed);
    const currentSegment = currentWord ? this.script.segments.find((segment) => segment.id === currentWord.segmentId) : this.script.segments[0];
    const currentBlock = currentWord ? currentSegment?.blocks.find((block) => block.id === currentWord.blockId) : currentSegment?.blocks[0];
    const currentPhrase = currentWord ? currentBlock?.phrases.find((phrase) => phrase.id === currentWord.phraseId) : currentBlock?.phrases[0];
    const currentWordIndex = currentWord?.index ?? Math.max(0, this.script.words.length - 1);
    const previousWord = currentWordIndex > 0 ? this.script.words[currentWordIndex - 1] : undefined;
    const nextWord = this.script.words[currentWordIndex + 1];

    return {
      elapsedMs: clampedElapsed,
      remainingMs: Math.max(0, this.script.totalDurationMs - clampedElapsed),
      progress: this.script.totalDurationMs === 0 ? 1 : clampedElapsed / this.script.totalDurationMs,
      isComplete: clampedElapsed >= this.script.totalDurationMs,
      currentWordIndex,
      currentWord,
      previousWord,
      nextWord,
      currentSegment,
      currentBlock,
      currentPhrase,
      nextTransitionMs: currentWord?.endMs ?? this.script.totalDurationMs,
      presentation: {
        segmentName: currentSegment?.name,
        blockName: currentBlock?.name,
        phraseText: currentPhrase?.text,
        visibleWords: currentPhrase?.words ?? [],
        activeWordInPhrase: currentPhrase ? currentPhrase.words.findIndex((word) => word.id === currentWord?.id) : -1
      }
    };
  }

  public seek(elapsedMs: number): PlayerState {
    return this.getState(elapsedMs);
  }

  private findCurrentWord(elapsedMs: number): CompiledWord | undefined {
    return this.script.words.find((word) => word.endMs > elapsedMs && word.endMs > word.startMs) ?? this.script.words.at(-1);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
