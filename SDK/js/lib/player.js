export class TpsPlayer {
    script;
    blockById = new Map();
    phraseById = new Map();
    segmentById = new Map();
    constructor(script) {
        this.script = script;
        for (const segment of script.segments) {
            this.segmentById.set(segment.id, segment);
            for (const block of segment.blocks) {
                this.blockById.set(block.id, block);
                for (const phrase of block.phrases) {
                    this.phraseById.set(phrase.id, phrase);
                }
            }
        }
    }
    getState(elapsedMs) {
        const clampedElapsed = clamp(elapsedMs, 0, this.script.totalDurationMs);
        const currentWord = this.findCurrentWord(clampedElapsed);
        const currentSegment = currentWord ? this.segmentById.get(currentWord.segmentId) : this.script.segments[0];
        const currentBlock = currentWord ? this.blockById.get(currentWord.blockId) : currentSegment?.blocks[0];
        const currentPhrase = currentWord ? this.phraseById.get(currentWord.phraseId) : currentBlock?.phrases[0];
        const currentWordIndex = currentWord?.index ?? -1;
        const previousWord = currentWordIndex > 0 ? this.script.words[currentWordIndex - 1] : undefined;
        const nextWord = currentWordIndex >= 0 ? this.script.words[currentWordIndex + 1] : undefined;
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
    seek(elapsedMs) {
        return this.getState(elapsedMs);
    }
    *enumerateStates(stepMs = 100) {
        if (!Number.isFinite(stepMs) || stepMs <= 0) {
            throw new RangeError("stepMs must be greater than 0.");
        }
        if (this.script.totalDurationMs === 0) {
            yield this.getState(0);
            return;
        }
        for (let elapsedMs = 0; elapsedMs < this.script.totalDurationMs; elapsedMs += stepMs) {
            yield this.getState(elapsedMs);
        }
        yield this.getState(this.script.totalDurationMs);
    }
    findCurrentWord(elapsedMs) {
        if (this.script.words.length === 0) {
            return undefined;
        }
        let low = 0;
        let high = this.script.words.length - 1;
        let candidateIndex = -1;
        while (low <= high) {
            const middle = low + Math.floor((high - low) / 2);
            const word = this.script.words[middle];
            if (word.endMs > elapsedMs) {
                candidateIndex = middle;
                high = middle - 1;
            }
            else {
                low = middle + 1;
            }
        }
        if (candidateIndex >= 0) {
            for (let index = candidateIndex; index < this.script.words.length; index += 1) {
                const word = this.script.words[index];
                if (word.endMs > elapsedMs && word.endMs > word.startMs) {
                    return word;
                }
            }
        }
        return this.script.words.at(-1);
    }
}
function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}
