import { normalizeCompiledScript } from "./compiled-script.js";
import type { CompiledBlock, CompiledPhrase, CompiledScript, CompiledSegment, CompiledWord, PlayerState } from "./models.js";

export class TpsPlayer {
  private readonly blockById = new Map<string, CompiledBlock>();

  private readonly compiledScript: CompiledScript;

  private readonly phraseById = new Map<string, CompiledPhrase>();

  private readonly segmentById = new Map<string, CompiledSegment>();

  public constructor(compiledScript: CompiledScript) {
    this.compiledScript = normalizeCompiledScript(compiledScript);
    for (const segment of this.compiledScript.segments) {
      this.segmentById.set(segment.id, segment);
      for (const block of segment.blocks) {
        this.blockById.set(block.id, block);
        for (const phrase of block.phrases) {
          this.phraseById.set(phrase.id, phrase);
        }
      }
    }
  }

  public get script(): CompiledScript {
    return this.compiledScript;
  }

  public getState(elapsedMs: number): PlayerState {
    const clampedElapsed = clamp(elapsedMs, 0, this.compiledScript.totalDurationMs);
    const currentWord = this.findCurrentWord(clampedElapsed);
    const currentSegment = currentWord ? this.segmentById.get(currentWord.segmentId) : this.compiledScript.segments[0];
    const currentBlock = currentWord ? this.blockById.get(currentWord.blockId) : currentSegment?.blocks[0];
    const currentPhrase = currentWord ? this.phraseById.get(currentWord.phraseId) : currentBlock?.phrases[0];
    const currentWordIndex = currentWord?.index ?? -1;
    const previousWord = currentWordIndex > 0 ? this.compiledScript.words[currentWordIndex - 1] : undefined;
    const nextWord = currentWordIndex >= 0 ? this.compiledScript.words[currentWordIndex + 1] : undefined;

    return {
      elapsedMs: clampedElapsed,
      remainingMs: Math.max(0, this.compiledScript.totalDurationMs - clampedElapsed),
      progress: this.compiledScript.totalDurationMs === 0 ? 1 : clampedElapsed / this.compiledScript.totalDurationMs,
      isComplete: clampedElapsed >= this.compiledScript.totalDurationMs,
      currentWordIndex,
      currentWord,
      previousWord,
      nextWord,
      currentSegment,
      currentBlock,
      currentPhrase,
      nextTransitionMs: currentWord?.endMs ?? this.compiledScript.totalDurationMs,
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

  public *enumerateStates(stepMs = 100): IterableIterator<PlayerState> {
    if (!Number.isFinite(stepMs) || stepMs <= 0) {
      throw new RangeError("stepMs must be greater than 0.");
    }

    if (this.compiledScript.totalDurationMs === 0) {
      yield this.getState(0);
      return;
    }

    for (let elapsedMs = 0; elapsedMs < this.compiledScript.totalDurationMs; elapsedMs += stepMs) {
      yield this.getState(elapsedMs);
    }

    yield this.getState(this.compiledScript.totalDurationMs);
  }

  private findCurrentWord(elapsedMs: number): CompiledWord | undefined {
    if (this.compiledScript.words.length === 0) {
      return undefined;
    }

    let low = 0;
    let high = this.compiledScript.words.length - 1;
    let candidateIndex = -1;

    while (low <= high) {
      const middle = low + Math.floor((high - low) / 2);
      const word = this.compiledScript.words[middle]!;
      if (word.endMs > elapsedMs) {
        candidateIndex = middle;
        high = middle - 1;
      } else {
        low = middle + 1;
      }
    }

    if (candidateIndex >= 0) {
      for (let index = candidateIndex; index < this.compiledScript.words.length; index += 1) {
        const word = this.compiledScript.words[index]!;
        if (word.endMs > elapsedMs && word.endMs > word.startMs) {
          return word;
        }
      }
    }

    return this.compiledScript.words.at(-1);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
